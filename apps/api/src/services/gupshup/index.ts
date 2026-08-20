import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const GUPSHUP_API_BASE = "https://api.gupshup.io";

export interface GupshupMessage {
  phone: string;
  templateId: string;
  variables?: Record<string, string>;
}

export async function sendTemplateMessage(message: GupshupMessage): Promise<{ messageId: string } | null> {
  if (!env.GUPSHUP_ENABLED) {
    logger.info("[Gupshup MOCK] Would send template", { phone: message.phone });
    return { messageId: "mock-" + Date.now() };
  }

  const params = new URLSearchParams();
  params.append("channel", "whatsapp");
  params.append("source", env.GUPSHUP_SOURCE_NUMBER);
  params.append("destination", message.phone);
  params.append("src.name", env.GUPSHUP_APP_NAME);

  const templatePayload: Record<string, unknown> = {
    id: message.templateId,
    params: message.variables ? Object.values(message.variables) : [],
  };
  params.append("template", JSON.stringify(templatePayload));

  logger.info("[Gupshup] Sending template message", {
    phone: message.phone,
    templateId: message.templateId,
  });

  try {
    const response = await fetch(`${GUPSHUP_API_BASE}/wa/api/v1/template/msg`, {
      method: "POST",
      headers: {
        apikey: env.GUPSHUP_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json() as { status: string; messageId?: string; message?: string };

    if (data.status === "error" || data.status === "failed") {
      logger.error("[Gupshup] Send failed", { phone: message.phone, error: data.message });
      return null;
    }

    logger.info("[Gupshup] Message sent", { phone: message.phone, messageId: data.messageId });
    return { messageId: data.messageId || "" };
  } catch (error) {
    logger.error("[Gupshup] API error", { phone: message.phone, error: (error as Error).message });
    return null;
  }
}

// Re-export everything from the webhook processing sub-modules
export { handleButtonResponse, handleMessageStatus } from "./webhook.js";
export { isInboundMessage, isStatusEvent, parseButtonResponse, parseStatusEvent, maskPhone } from "./parser.js";
export type { GupshupInboundPayload, GupshupStatusPayload, GupshupPayload, ParsedButtonResponse, ParsedStatusEvent } from "./types.js";
