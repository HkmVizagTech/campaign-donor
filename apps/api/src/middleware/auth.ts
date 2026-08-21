import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AdminUser, IAdminUser } from "../models/AdminUser.js";
import { UnauthorizedError } from "../utils/errors.js";

export interface AuthRequest extends Request {
  admin?: IAdminUser;
}

function verifyAndAttachAdmin(token: string, req: Request, next: NextFunction): void {
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

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("No token provided"));
  }
  verifyAndAttachAdmin(authHeader.split(" ")[1], req, next);
}

// Browsers' EventSource API can't set custom headers, so the live-update
// stream also accepts the JWT as a query param. Only mounted on that one
// read-only route — never use this for state-changing endpoints.
export function authenticateEventStream(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : (req.query.token as string | undefined);

  if (!token) {
    return next(new UnauthorizedError("No token provided"));
  }
  verifyAndAttachAdmin(token, req, next);
}
