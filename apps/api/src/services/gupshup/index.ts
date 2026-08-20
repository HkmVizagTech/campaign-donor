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

  // TODO: Implement actual Gupshup API call
  logger.info("[Gupshup] Sending template", { phone: message.phone });
  return null;
}

// Re-export everything from the webhook processing sub-modules
export { handleButtonResponse, handleMessageStatus } from "./webhook.js";
export { isInboundMessage, isStatusEvent, parseButtonResponse, parseStatusEvent, maskPhone } from "./parser.js";
export type { GupshupInboundPayload, GupshupStatusPayload, GupshupPayload, ParsedButtonResponse, ParsedStatusEvent } from "./types.js";
