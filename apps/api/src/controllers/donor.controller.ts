import { Request, Response, NextFunction } from "express";
import * as donorService from "../services/donor.service.js";
import { AuthRequest } from "../middleware/auth.js";
import { AuditLog } from "../models/AuditLog.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const donor = await donorService.createDonor(req.body);
    res.status(201).json({ success: true, data: donor });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = Math.min(parseInt(String(req.query.limit)) || 20, 100);
    const search = req.query.search as string | undefined;
    const sort = req.query.sort as string | undefined;
    const result = await donorService.listDonors({ page, limit, search, sort });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const donor = await donorService.getDonorById(String(req.params.id));
    res.json({ success: true, data: donor });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const donor = await donorService.updateDonor(String(req.params.id), req.body);
    res.json({ success: true, data: donor });
  } catch (err) {
    next(err);
  }
}

export async function issueBrick(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = (req as AuthRequest).admin!;
    const donorId = String(req.params.id);
    const issuance = await donorService.issueBrick(donorId, req.body, admin._id.toString());

    await AuditLog.create({
      adminId: admin._id,
      action: "brick_issued",
      entity: "donor",
      entityId: donorId as any,
      metadata: { type: issuance.type, referenceNumber: issuance.referenceNumber, amount: issuance.amount },
    });

    res.status(201).json({ success: true, data: issuance });
  } catch (err) {
    next(err);
  }
}

export async function getBrickIssuances(req: Request, res: Response, next: NextFunction) {
  try {
    const issuances = await donorService.getBrickIssuances(String(req.params.id));
    res.json({ success: true, data: issuances });
  } catch (err) {
    next(err);
  }
}
