import { Request, Response, NextFunction } from "express";
import * as donorService from "../services/donor.service.js";

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
