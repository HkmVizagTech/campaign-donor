import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import { AuthRequest } from "../middleware/auth.js";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = (req as AuthRequest).admin!;
    res.json({
      success: true,
      data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
}
