import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

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
    const url = `https://partner.gupshup.io/partner/app/${env.GUPSHUP_APP_ID}/template/msg`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: env.GUPSHUP_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const text = await response.text();
    let data: { status?: string; messageId?: string; message?: string; payload?: { payload?: { detail?: string; object?: string } } } | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!response.ok || !data || data.status === "error" || data.status === "failed") {
      const detail =
        data?.message ||
        data?.payload?.payload?.detail ||
        data?.payload?.payload?.object ||
        text.slice(0, 300) ||
        `HTTP ${response.status}`;
      logger.error("[Gupshup] Send failed", {
        phone: message.phone,
        httpStatus: response.status,
        detail,
      });
      throw new Error(`Gupshup rejected (${response.status}): ${detail}`);
    }

    logger.info("[Gupshup] Message sent", { phone: message.phone, messageId: data.messageId });
    return { messageId: data.messageId || "" };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Gupshup rejected")) {
      throw error;
    }
    logger.error("[Gupshup] API error", { phone: message.phone, error: (error as Error).message });
    throw new Error(`Gupshup request failed: ${(error as Error).message}`);
  }
}

// Re-export everything from the webhook processing sub-modules
export { handleButtonResponse, handleMessageStatus } from "./webhook.js";
export { isInboundMessage, isStatusEvent, parseButtonResponse, parseStatusEvent, maskPhone } from "./parser.js";
export type { GupshupInboundPayload, GupshupStatusPayload, GupshupPayload, ParsedButtonResponse, ParsedStatusEvent } from "./types.js";
