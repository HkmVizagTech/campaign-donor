import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// Extend Request to carry the raw body for signature verification
export interface WebhookRequest extends Request {
  rawBody?: Buffer;
}

export function verifyGupshupSignature(req: WebhookRequest, res: Response, next: NextFunction): void {
  const secret = env.GUPSHUP_WEBHOOK_SECRET;

  // In development with no secret configured, skip verification
  if (!secret) {
    if (env.NODE_ENV === "production") {
      logger.error("[Webhook] GUPSHUP_WEBHOOK_SECRET not configured in production");
      res.status(500).json({ success: false, message: "Webhook configuration error" });
      return;
    }
    logger.warn("[Webhook] Signature verification skipped (no secret in development)");
    next();
    return;
  }

  const signature = req.headers["x-gupshup-signature"] as string | undefined;
  if (!signature) {
    logger.warn("[Webhook] Missing signature header");
    res.status(401).json({ success: false, message: "Missing signature" });
    return;
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    logger.warn("[Webhook] Missing raw body for verification");
    res.status(400).json({ success: false, message: "Missing request body" });
    return;
  }

  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      logger.warn("[Webhook] Invalid signature");
      res.status(401).json({ success: false, message: "Invalid signature" });
      return;
    }
  } catch {
    logger.warn("[Webhook] Signature comparison failed");
    res.status(401).json({ success: false, message: "Invalid signature" });
    return;
  }

  next();
}
