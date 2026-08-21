import { Request, Response, NextFunction } from "express";
import * as campaignService from "../services/campaign.service.js";
import { AuthRequest } from "../middleware/auth.js";
import { AuditLog } from "../models/AuditLog.js";

function getId(req: Request): string {
  return String(req.params.id);
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = (req as AuthRequest).admin!;
    const campaign = await campaignService.createCampaign(req.body, admin._id.toString());

    await AuditLog.create({
      adminId: admin._id,
      action: "campaign_created",
      entity: "campaign",
      entityId: campaign._id,
      metadata: { name: campaign.name },
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const campaigns = await campaignService.listCampaigns();
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const campaign = await campaignService.getCampaignById(getId(req));
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const campaign = await campaignService.updateCampaign(getId(req), req.body);

    const admin = (req as AuthRequest).admin!;
    await AuditLog.create({
      adminId: admin._id,
      action: "campaign_updated",
      entity: "campaign",
      entityId: campaign._id,
      metadata: req.body,
    });

    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

export async function addRecipients(req: Request, res: Response, next: NextFunction) {
  try {
    const { donorIds, addAll, importBatchId } = req.body;
    const result = await campaignService.addRecipients(getId(req), donorIds, addAll, importBatchId);

    const admin = (req as AuthRequest).admin!;
    await AuditLog.create({
      adminId: admin._id,
      action: "recipients_added",
      entity: "campaign",
      entityId: req.params.id as any,
      metadata: result,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getRecipients(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = Math.min(parseInt(String(req.query.limit)) || 20, 100);
    const response = req.query.response as string | undefined;
    const messageStatus = req.query.messageStatus as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await campaignService.getCampaignRecipients(getId(req), {
      page, limit, response, messageStatus, search,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function updateResponse(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = (req as AuthRequest).admin!;
    const recipient = await campaignService.updateResponse(
      getId(req),
      String(req.params.recipientId),
      req.body.response,
      admin._id.toString()
    );

    await AuditLog.create({
      adminId: admin._id,
      action: "response_manually_changed",
      entity: "campaign_recipient",
      entityId: recipient._id,
      metadata: { response: req.body.response },
    });

    res.json({ success: true, data: recipient });
  } catch (err) {
    next(err);
  }
}

export async function updateBrickStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = (req as AuthRequest).admin!;
    const recipient = await campaignService.updateBrickStatus(
      getId(req),
      String(req.params.recipientId),
      req.body.brickStatus
    );

    await AuditLog.create({
      adminId: admin._id,
      action: "brick_status_changed",
      entity: "campaign_recipient",
      entityId: recipient._id,
      metadata: { brickStatus: req.body.brickStatus },
    });

    res.json({ success: true, data: recipient });
  } catch (err) {
    next(err);
  }
}

export async function send(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = (req as AuthRequest).admin!;
    const { headerImageUrl, eventDate, eventTime, programItem } = req.body || {};
    const result = await campaignService.sendCampaign(getId(req), {
      headerImageUrl, eventDate, eventTime, programItem,
    });

    await AuditLog.create({
      adminId: admin._id,
      action: "campaign_send_started",
      entity: "campaign",
      entityId: req.params.id as any,
      metadata: { totalRecipients: result.totalRecipients },
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getId(req);
    await campaignService.recalculateStats(id);
    const campaign = await campaignService.getCampaignById(id);
    res.json({
      success: true,
      data: {
        totalRecipients: campaign.totalRecipients,
        totalSent: campaign.totalSent,
        totalDelivered: campaign.totalDelivered,
        totalFailed: campaign.totalFailed,
        totalYes: campaign.totalYes,
        totalNo: campaign.totalNo,
        totalPending: campaign.totalPending,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function dashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await campaignService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
