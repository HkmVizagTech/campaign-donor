import mongoose from "mongoose";
import { Campaign, ICampaign } from "../models/Campaign.js";
import { CampaignRecipient, ICampaignRecipient } from "../models/CampaignRecipient.js";
import { ResponseHistory } from "../models/ResponseHistory.js";
import { Donor } from "../models/Donor.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { v4 as uuidv4 } from "uuid";
import { ResponseStatus, CampaignStatus } from "@garbha-gudi/shared";
import { sendTemplateMessage } from "./gupshup/index.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";
import { emitAppEvent } from "../utils/events.js";

export async function createCampaign(
  data: {
    name: string;
    description?: string;
    type?: string;
    templateId?: string;
    templateName?: string;
    headerImageUrl?: string;
    eventDate?: string;
    eventTime?: string;
    programItem?: string;
  },
  adminId: string
) {
  return Campaign.create({
    campaignId: uuidv4(),
    name: data.name,
    description: data.description,
    type: data.type || "attendance",
    templateId: data.templateId || env.GUPSHUP_TEMPLATE_ID,
    templateName: data.templateName || env.GUPSHUP_TEMPLATE_NAME,
    headerImageUrl: data.headerImageUrl,
    eventDate: data.eventDate,
    eventTime: data.eventTime,
    programItem: data.programItem,
    createdBy: adminId,
  });
}

export async function listCampaigns() {
  return Campaign.find().sort({ createdAt: -1 });
}

export async function getCampaignById(id: string): Promise<ICampaign> {
  const campaign = await Campaign.findById(id);
  if (!campaign) throw new NotFoundError("Campaign not found");
  return campaign;
}

export async function updateCampaign(id: string, updates: Partial<ICampaign>) {
  const campaign = await Campaign.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!campaign) throw new NotFoundError("Campaign not found");
  return campaign;
}

export async function addRecipients(campaignId: string, donorIds?: string[], addAll?: boolean) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new NotFoundError("Campaign not found");
  if (campaign.status !== CampaignStatus.Draft) {
    throw new BadRequestError("Can only add recipients to draft campaigns");
  }

  let donors;
  if (addAll) {
    donors = await Donor.find();
  } else if (donorIds && donorIds.length > 0) {
    donors = await Donor.find({ _id: { $in: donorIds } });
  } else {
    throw new BadRequestError("Provide donorIds or set addAll to true");
  }

  if (donors.length === 0) throw new BadRequestError("No donors found");

  // Multiple donor records can share the same phone (imports aren't deduped
  // across batches) — keep only the first donor per phone so each number
  // gets at most one WhatsApp message for this campaign.
  const seenPhones = new Set<string>();
  const uniqueDonors = donors.filter((d) => {
    if (seenPhones.has(d.phone)) return false;
    seenPhones.add(d.phone);
    return true;
  });

  const recipientDocs = uniqueDonors.map((d) => ({
    campaignId: campaign._id,
    donorId: d._id,
    phone: d.phone,
  }));

  const result = await CampaignRecipient.insertMany(recipientDocs, { ordered: false }).catch((err) => {
    // Bulk insert with ordered:false — duplicates are skipped
    return err.insertedDocs || [];
  });

  const insertedCount = Array.isArray(result) ? result.length : 0;

  await Campaign.findByIdAndUpdate(campaignId, {
    totalRecipients: await CampaignRecipient.countDocuments({ campaignId }),
  });

  emitAppEvent({ campaignId });

  return {
    inserted: insertedCount,
    total: donors.length,
    duplicatePhonesSkipped: donors.length - uniqueDonors.length,
  };
}

export async function getCampaignRecipients(
  campaignId: string,
  params: { page: number; limit: number; response?: string; messageStatus?: string; search?: string }
) {
  const filter: Record<string, unknown> = { campaignId: new mongoose.Types.ObjectId(campaignId) };
  if (params.response) filter.response = params.response;
  if (params.messageStatus) filter.messageStatus = params.messageStatus;

  const pipeline: mongoose.PipelineStage[] = [
    { $match: filter },
    {
      $lookup: {
        from: "donors",
        localField: "donorId",
        foreignField: "_id",
        as: "donor",
      },
    },
    { $unwind: { path: "$donor", preserveNullAndEmptyArrays: true } },
  ];

  if (params.search) {
    pipeline.push({
      $match: {
        $or: [
          { "donor.name": { $regex: params.search, $options: "i" } },
          { phone: { $regex: params.search, $options: "i" } },
          { "donor.donorId": { $regex: params.search, $options: "i" } },
        ],
      },
    });
  }

  const countPipeline = [...pipeline, { $count: "total" }];
  const countResult = await CampaignRecipient.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  const skip = (params.page - 1) * params.limit;
  pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: params.limit });

  const data = await CampaignRecipient.aggregate(pipeline);

  return {
    data,
    pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
  };
}

export async function updateResponse(
  campaignId: string,
  recipientId: string,
  newResponse: "yes" | "no",
  adminId: string
) {
  const recipient = await CampaignRecipient.findOne({ _id: recipientId, campaignId });
  if (!recipient) throw new NotFoundError("Recipient not found");

  const previousResponse = recipient.response;
  recipient.response = newResponse as ResponseStatus;
  recipient.responseAt = new Date();
  await recipient.save();

  await ResponseHistory.create({
    campaignId: new mongoose.Types.ObjectId(campaignId),
    donorId: recipient.donorId,
    previousResponse,
    newResponse,
    source: "admin",
    changedBy: new mongoose.Types.ObjectId(adminId),
  });

  await recalculateStats(campaignId);
  emitAppEvent({ campaignId });
  return recipient;
}

export async function updateBrickStatus(campaignId: string, recipientId: string, brickStatus: string) {
  const recipient = await CampaignRecipient.findOne({ _id: recipientId, campaignId });
  if (!recipient) throw new NotFoundError("Recipient not found");

  recipient.brickStatus = brickStatus as any;
  await recipient.save();
  emitAppEvent({ campaignId });
  return recipient;
}

export async function recalculateStats(campaignId: string) {
  const stats = await CampaignRecipient.aggregate([
    { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: null,
        totalRecipients: { $sum: 1 },
        totalSent: { $sum: { $cond: [{ $in: ["$messageStatus", ["sent", "delivered"]] }, 1, 0] } },
        totalDelivered: { $sum: { $cond: [{ $eq: ["$messageStatus", "delivered"] }, 1, 0] } },
        totalFailed: { $sum: { $cond: [{ $eq: ["$messageStatus", "failed"] }, 1, 0] } },
        totalYes: { $sum: { $cond: [{ $eq: ["$response", "yes"] }, 1, 0] } },
        totalNo: { $sum: { $cond: [{ $eq: ["$response", "no"] }, 1, 0] } },
        totalPending: { $sum: { $cond: [{ $eq: ["$response", "pending"] }, 1, 0] } },
      },
    },
  ]);

  const s = stats[0] || { totalRecipients: 0, totalSent: 0, totalDelivered: 0, totalFailed: 0, totalYes: 0, totalNo: 0, totalPending: 0 };

  await Campaign.findByIdAndUpdate(campaignId, {
    totalRecipients: s.totalRecipients,
    totalSent: s.totalSent,
    totalDelivered: s.totalDelivered,
    totalFailed: s.totalFailed,
    totalYes: s.totalYes,
    totalNo: s.totalNo,
    totalPending: s.totalPending,
  });
}

export async function sendCampaign(
  campaignId: string,
  messageVariables?: { headerImageUrl?: string; eventDate?: string; eventTime?: string; programItem?: string }
) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new NotFoundError("Campaign not found");

  if (campaign.status === CampaignStatus.Sending) {
    throw new BadRequestError("Campaign is already sending");
  }

  // Fall back to the configured default template if the campaign has none of its own
  const templateId = campaign.templateId || env.GUPSHUP_TEMPLATE_ID;
  if (!templateId) {
    throw new BadRequestError("Campaign has no template ID configured");
  }

  const totalRecipients = await CampaignRecipient.countDocuments({
    campaignId: campaign._id,
    messageStatus: { $in: ["not_sent", "queued"] },
  });

  if (totalRecipients === 0) {
    throw new BadRequestError("No unsent recipients found");
  }

  // Message variables are filled in at send time, not campaign creation —
  // persist them on the campaign so re-sends/resumes reuse the same values.
  if (messageVariables) {
    if (messageVariables.headerImageUrl !== undefined) campaign.headerImageUrl = messageVariables.headerImageUrl;
    if (messageVariables.eventDate !== undefined) campaign.eventDate = messageVariables.eventDate;
    if (messageVariables.eventTime !== undefined) campaign.eventTime = messageVariables.eventTime;
    if (messageVariables.programItem !== undefined) campaign.programItem = messageVariables.programItem;
  }

  campaign.status = CampaignStatus.Sending;
  await campaign.save();
  emitAppEvent({ campaignId });

  // Sending can take minutes for large recipient lists (rate-limited to 1/sec).
  // Kick it off in the background so the HTTP request returns immediately —
  // the campaign detail page polls stats/status while status is "sending".
  processCampaignSend(campaignId, {
    templateId,
    headerImageUrl: campaign.headerImageUrl,
    eventDate: campaign.eventDate,
    eventTime: campaign.eventTime,
    programItem: campaign.programItem,
  }).catch((err) => {
    logger.error("[Campaign] Background send crashed", { campaignId, error: err.message });
  });

  return { started: true, totalRecipients };
}

interface SendTemplateConfig {
  templateId: string;
  headerImageUrl?: string;
  eventDate?: string;
  eventTime?: string;
  programItem?: string;
}

async function processCampaignSend(campaignId: string, template: SendTemplateConfig) {
  const recipients = await CampaignRecipient.find({
    campaignId,
    messageStatus: { $in: ["not_sent", "queued"] },
  }).populate("donorId");

  let sent = 0;
  let failed = 0;

  const BATCH_DELAY_MS = 1000;

  for (const recipient of recipients) {
    const donor = recipient.donorId as any;
    const phone = recipient.phone;

    try {
      const result = await sendTemplateMessage({
        phone,
        templateId: template.templateId,
        headerImageUrl: template.headerImageUrl,
        // Positional — must match the approved template's {{1}}..{{4}} order
        variables: {
          name: donor?.name || "Donor",
          eventDate: template.eventDate || "",
          eventTime: template.eventTime || "",
          programItem: template.programItem || "",
        },
      });

      if (result) {
        recipient.messageStatus = "sent" as any;
        recipient.sentAt = new Date();
        recipient.externalMessageId = result.messageId;
        await recipient.save();
        sent++;
      } else {
        recipient.messageStatus = "failed" as any;
        recipient.failedAt = new Date();
        recipient.failureReason = "Gupshup API returned null";
        await recipient.save();
        failed++;
      }
    } catch (err) {
      recipient.messageStatus = "failed" as any;
      recipient.failedAt = new Date();
      recipient.failureReason = (err as Error).message;
      await recipient.save();
      failed++;
    }

    emitAppEvent({ campaignId });
    await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
  }

  await recalculateStats(campaignId);

  const campaign = await Campaign.findById(campaignId);
  if (campaign) {
    if (failed === 0 && sent > 0) {
      campaign.status = CampaignStatus.Completed;
    } else if (sent === 0 && failed > 0) {
      campaign.status = CampaignStatus.Draft;
    } else {
      campaign.status = CampaignStatus.Completed;
    }
    await campaign.save();
  }

  emitAppEvent({ campaignId });
  logger.info("[Campaign] Send completed", { campaignId, sent, failed });
}

export async function getDashboardStats() {
  const totalDonors = await Donor.countDocuments();
  const activeCampaigns = await Campaign.countDocuments({ status: { $ne: "cancelled" } });
  const latestCampaign = await Campaign.findOne().sort({ createdAt: -1 });

  return {
    totalDonors,
    activeCampaigns,
    campaign: latestCampaign
      ? {
          _id: latestCampaign._id,
          name: latestCampaign.name,
          totalRecipients: latestCampaign.totalRecipients,
          totalSent: latestCampaign.totalSent,
          totalDelivered: latestCampaign.totalDelivered,
          totalFailed: latestCampaign.totalFailed,
          totalYes: latestCampaign.totalYes,
          totalNo: latestCampaign.totalNo,
          totalPending: latestCampaign.totalPending,
        }
      : undefined,
  };
}
