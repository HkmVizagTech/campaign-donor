import { GupshupInboundPayload, GupshupStatusPayload, ParsedButtonResponse, ParsedStatusEvent } from "./types.js";
import { normalizePhone } from "../../utils/phone.js";

export function isInboundMessage(payload: any): payload is GupshupInboundPayload {
  return (
    payload?.type === "message" &&
    payload?.message?.type === "button" &&
    payload?.message?.button?.payload != null
  );
}

export function isStatusEvent(payload: any): payload is GupshupStatusPayload {
  return payload?.type === "message-event" && typeof payload?.status === "string";
}

export function parseButtonResponse(payload: GupshupInboundPayload): ParsedButtonResponse {
  return {
    phone: normalizePhone(payload.message.source),
    buttonPayload: payload.message.button!.payload,
    buttonText: payload.message.button!.text,
    messageId: payload.message.id,
    timestamp: new Date(payload.timestamp * 1000),
  };
}

export function parseStatusEvent(payload: GupshupStatusPayload): ParsedStatusEvent {
  const status = payload.status === "unknown" ? "failed" : payload.status;
  return {
    phone: normalizePhone(payload.destination),
    messageId: payload.messageId,
    status,
    errorCode: payload.errorCode,
    errorMessage: payload.errorMessage,
    timestamp: new Date(payload.timestamp * 1000),
  };
}

export function maskPhone(phone: string): string {
  if (phone.length <= 6) return "****";
  return phone.slice(0, 3) + "****" + phone.slice(-2);
}
