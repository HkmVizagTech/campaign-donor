import { Request, Response, NextFunction } from "express";
import * as importService from "../services/import.service.js";
import { AuthRequest } from "../middleware/auth.js";
import { AuditLog } from "../models/AuditLog.js";

export async function upload(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {
      name: req.body.nameColumn || req.headers["x-name-column"] as string,
      phone: req.body.phoneColumn || req.headers["x-phone-column"] as string,
    };

    if (!mapping.name || !mapping.phone) {
      res.status(400).json({ success: false, message: "Column mapping for name and phone is required" });
      return;
    }

    const admin = (req as AuthRequest).admin!;
    const result = await importService.importDonors(req.file.buffer, req.file.originalname, mapping, admin._id.toString());

    await AuditLog.create({
      adminId: admin._id,
      action: "donor_imported",
      entity: "import_batch",
      entityId: result.batch._id,
      metadata: { fileName: req.file.originalname, ...result.summary },
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const batches = await importService.getImportBatches();
    res.json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const batch = await importService.getImportBatchById(String(req.params.id));
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
}

export async function preview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
    const parsed = importService.parseFile(req.file.buffer, req.file.originalname);
    res.json({ success: true, data: parsed });
  } catch (err) {
    next(err);
  }
}
