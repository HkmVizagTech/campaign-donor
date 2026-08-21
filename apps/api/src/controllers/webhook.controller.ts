import { Response } from "express";
import { WebhookRequest } from "../middleware/webhookAuth.js";
import { isInboundMessage, isStatusEvent, parseButtonResponse, parseStatusEvent, maskPhone } from "../services/gupshup/parser.js";
import { handleButtonResponse, handleMessageStatus } from "../services/gupshup/webhook.js";
import { logger } from "../utils/logger.js";

// Counter for safe request-level logging (no PII)
let webhookCounter = 0;

export async function handleGupshupWebhook(req: WebhookRequest, res: Response): Promise<void> {
  const requestId = `wh-${Date.now()}-${++webhookCounter}`;

  try {
    const payload = req.body;

    // Safe log: event type only, no full payload (which may contain phone numbers / keys)
    const eventType = payload?.type || "unknown";
    logger.info(`[Webhook:${requestId}] Received event`, { type: eventType });

    // --- Quick Reply button response ---
    if (isInboundMessage(payload)) {
      const event = parseButtonResponse(payload);

      logger.info(`[Webhook:${requestId}] Button response`, {
        phone: maskPhone(event.phone),
        payload: event.buttonPayload,
      });

      // Process async — respond 200 first
      handleButtonResponse(event).catch((err) => {
        logger.error(`[Webhook:${requestId}] Error processing button response`, {
          error: err.message,
          stack: err.stack,
        });
      });

      res.status(200).end();
      return;
    }

    // --- Message status callback (sent / delivered / failed) ---
    if (isStatusEvent(payload)) {
      const event = parseStatusEvent(payload);

      logger.info(`[Webhook:${requestId}] Status event`, {
        phone: maskPhone(event.phone),
        status: event.status,
      });

      handleMessageStatus(event).catch((err) => {
        logger.error(`[Webhook:${requestId}] Error processing status event`, {
          error: err.message,
          stack: err.stack,
        });
      });

      res.status(200).end();
      return;
    }

    // --- Unknown payload type — still return 200 so Gupshup doesn't retry ---
    // Logs shape (keys only, no phone/content) so an unexpected format is
    // diagnosable from logs alone instead of needing another round-trip.
    logger.warn(`[Webhook:${requestId}] Unrecognised payload type`, {
      type: eventType,
      innerType: payload?.payload?.type,
      topLevelKeys: Object.keys(payload || {}),
      innerKeys: Object.keys(payload?.payload || {}),
    });
    res.status(200).end();
  } catch (err: any) {
    // Never let an error cause a non-2xx — Gupshup would retry indefinitely
    logger.error(`[Webhook:${requestId}] Unexpected error`, {
      error: err.message,
      stack: err.stack,
    });
    res.status(200).end();
  }
}
