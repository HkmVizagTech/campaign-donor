import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

export interface GupshupMessage {
  phone: string;
  templateId: string;
  variables?: Record<string, string>;
  // Public URL for the template's media header (image/video/document), if any
  headerImageUrl?: string;
}

export async function sendTemplateMessage(message: GupshupMessage): Promise<{ messageId: string } | null> {
  if (!env.GUPSHUP_ENABLED) {
    logger.info("[Gupshup MOCK] Would send template", { phone: message.phone });
    return { messageId: "mock-" + Date.now() };
  }

  // Gupshup expects bare digits (country code + number), no leading "+"
  const stripPlus = (phone: string) => phone.replace(/^\+/, "");

  const params = new URLSearchParams();
  params.append("channel", "whatsapp");
  params.append("source", stripPlus(env.GUPSHUP_SOURCE_NUMBER));
  params.append("destination", stripPlus(message.phone));
  params.append("src.name", env.GUPSHUP_APP_NAME);

  // `params` holds ONLY the body's positional variables ({{1}}..{{n}}).
  // A media header is passed separately in the `message` field below —
  // putting it in `params` inflates the count and Gupshup rejects the send.
  const bodyParams = message.variables ? Object.values(message.variables) : [];
  const templatePayload: Record<string, unknown> = {
    id: message.templateId,
    params: bodyParams,
  };
  params.append("template", JSON.stringify(templatePayload));

  if (message.headerImageUrl) {
    params.append(
      "message",
      JSON.stringify({ type: "image", image: { link: message.headerImageUrl } })
    );
  }

  logger.info("[Gupshup] Sending template message", {
    phone: message.phone,
    templateId: message.templateId,
    paramCount: bodyParams.length,
    hasHeaderImage: !!message.headerImageUrl,
    sourceConfigured: !!env.GUPSHUP_SOURCE_NUMBER,
    appNameConfigured: !!env.GUPSHUP_APP_NAME,
  });

  try {
    // Standard (non-partner) API — GUPSHUP_API_KEY is a plain account API
    // key, not a partner app token (sk_...), so this is the right endpoint
    // for it: authenticated via the `apikey` header, no appId in the path.
    const url = "https://api.gupshup.io/wa/api/v1/template/msg";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: env.GUPSHUP_API_KEY,
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
        rawResponse: text.slice(0, 500),
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
