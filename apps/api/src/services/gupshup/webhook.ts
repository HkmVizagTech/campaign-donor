import mongoose from "mongoose";
import { CampaignRecipient } from "../../models/CampaignRecipient.js";
import { Campaign } from "../../models/Campaign.js";
import { ResponseHistory } from "../../models/ResponseHistory.js";
import { logger } from "../../utils/logger.js";
import { ResponseStatus, MessageStatus } from "@garbha-gudi/shared";
import { ParsedButtonResponse, ParsedStatusEvent } from "./types.js";
import { maskPhone } from "./parser.js";
import { emitAppEvent } from "../../utils/events.js";

const BUTTON_RESPONSE_MAP: Record<string, ResponseStatus> = {
  ATTEND_YES: ResponseStatus.Yes,
  ATTEND_NO: ResponseStatus.No,
  YES: ResponseStatus.Yes,
  NO: ResponseStatus.No,
};

// Quick-reply buttons can carry a short code as their payload (e.g. ATTEND_YES)
// or, if the template was built without a custom payload, the visible button
// text itself (e.g. "Yes, I'm coming"). Check both, and fall back to matching
// a leading "yes"/"no" so full-sentence button text still resolves correctly.
function mapButtonToResponse(buttonPayload?: string, buttonText?: string): ResponseStatus | null {
  for (const raw of [buttonPayload, buttonText]) {
    const normalized = raw?.trim().toUpperCase();
    if (!normalized) continue;
    if (BUTTON_RESPONSE_MAP[normalized]) return BUTTON_RESPONSE_MAP[normalized];
    if (normalized.startsWith("YES")) return ResponseStatus.Yes;
    if (normalized.startsWith("NO")) return ResponseStatus.No;
  }
  return null;
}

export async function handleButtonResponse(event: ParsedButtonResponse): Promise<void> {
  const { phone, buttonPayload, buttonText, messageId, timestamp } = event;

  logger.info("[Gupshup] Button response received", {
    phone: maskPhone(phone),
    payload: buttonPayload,
    buttonText,
    messageId,
  });

  const mappedResponse = mapButtonToResponse(buttonPayload, buttonText);
  if (!mappedResponse) {
    logger.warn("[Gupshup] Unknown button payload", { payload: buttonPayload, buttonText });
    return;
  }

  // Find the most recent active campaign recipient for this phone
  const recipient = await findActiveRecipientByPhone(phone);
  if (!recipient) {
    logger.warn("[Gupshup] No active campaign recipient found for phone", { phone: maskPhone(phone) });
    return;
  }

  const previousResponse = recipient.response;

  // Skip if response hasn't changed
  if (previousResponse === mappedResponse) {
    logger.info("[Gupshup] Response unchanged, skipping", {
      phone: maskPhone(phone),
      response: mappedResponse,
    });
    return;
  }

  // Update recipient
  recipient.response = mappedResponse;
  recipient.responseAt = timestamp;
  recipient.externalMessageId = messageId;
  await recipient.save();

  // Record history
  await ResponseHistory.create({
    campaignId: recipient.campaignId,
    donorId: recipient.donorId,
    previousResponse,
    newResponse: mappedResponse,
    source: "whatsapp",
  });

  // Recalculate campaign stats in the background (non-blocking), then push a
  // live-update event so admin portal tabs refresh without polling
  const campaignIdStr = recipient.campaignId.toString();
  recalculateStatsSafe(campaignIdStr)
    .catch((err) => {
      logger.error("[Gupshup] Failed to recalculate stats", { error: err.message });
    })
    .finally(() => emitAppEvent({ campaignId: campaignIdStr }));

  logger.info("[Gupshup] Response recorded", {
    phone: maskPhone(phone),
    previous: previousResponse,
    new: mappedResponse,
    campaignId: recipient.campaignId.toString(),
  });
}

export async function handleMessageStatus(event: ParsedStatusEvent): Promise<void> {
  const { phone, messageId, status, errorCode, errorMessage, timestamp } = event;

  logger.info("[Gupshup] Message status update", {
    phone: maskPhone(phone),
    status,
    messageId,
  });

  // Find recipient by externalMessageId first, fall back to phone + most recent
  let recipient = await CampaignRecipient.findOne({ externalMessageId: messageId });

  if (!recipient) {
    recipient = await findActiveRecipientByPhone(phone);
  }

  if (!recipient) {
    logger.warn("[Gupshup] No recipient found for status update", {
      phone: maskPhone(phone),
      messageId,
    });
    return;
  }

  // Update message status
  switch (status) {
    case "queued":
      if (recipient.messageStatus === MessageStatus.NotSent) {
        recipient.messageStatus = MessageStatus.Queued;
      }
      break;

    case "sent":
      if (recipient.messageStatus === MessageStatus.NotSent || recipient.messageStatus === MessageStatus.Queued) {
        recipient.messageStatus = MessageStatus.Sent;
        recipient.sentAt = timestamp;
      }
      break;

    case "delivered":
      recipient.messageStatus = MessageStatus.Delivered;
      recipient.deliveredAt = timestamp;
      break;

    case "failed":
      recipient.messageStatus = MessageStatus.Failed;
      recipient.failedAt = timestamp;
      recipient.failureReason = errorMessage || errorCode || "Unknown error";
      break;
  }

  recipient.externalMessageId = messageId;
  await recipient.save();

  // Recalculate stats, then push a live-update event
  const campaignIdStr = recipient.campaignId.toString();
  recalculateStatsSafe(campaignIdStr)
    .catch((err) => {
      logger.error("[Gupshup] Failed to recalculate stats", { error: err.message });
    })
    .finally(() => emitAppEvent({ campaignId: campaignIdStr }));
}

async function findActiveRecipientByPhone(phone: string) {
  // Find the most recent campaign recipient for this phone
  // that belongs to a non-cancelled campaign
  const campaigns = await Campaign.find({ status: { $nin: ["cancelled", "draft"] } }).select("_id").lean();
  const campaignIds = campaigns.map((c) => c._id);

  if (campaignIds.length === 0) return null;

  return CampaignRecipient.findOne({
    phone,
    campaignId: { $in: campaignIds },
  }).sort({ createdAt: -1 });
}

async function recalculateStatsSafe(campaignId: string) {
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
