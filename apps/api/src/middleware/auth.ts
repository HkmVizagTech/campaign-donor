import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AdminUser, IAdminUser } from "../models/AdminUser.js";
import { UnauthorizedError } from "../utils/errors.js";

export interface AuthRequest extends Request {
  admin?: IAdminUser;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("No token provided"));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    AdminUser.findById(decoded.sub)
      .then((admin) => {
        if (!admin || !admin.isActive) {
          return next(new UnauthorizedError("Invalid or inactive account"));
        }
        (req as AuthRequest).admin = admin;
        next();
      })
      .catch(() => next(new UnauthorizedError("Invalid token")));
  } catch {
    next(new UnauthorizedError("Invalid token"));
  }
}
