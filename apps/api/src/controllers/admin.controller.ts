import { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service.js";
import { AuthRequest } from "../middleware/auth.js";
import { BadRequestError } from "../utils/errors.js";

const CONFIRMATION_PHRASE = "DELETE ALL DATA";

export async function resetAllData(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.body?.confirm !== CONFIRMATION_PHRASE) {
      throw new BadRequestError(`Type "${CONFIRMATION_PHRASE}" exactly to confirm.`);
    }

    const admin = (req as AuthRequest).admin!;
    const result = await adminService.resetAllData(admin._id.toString());
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
