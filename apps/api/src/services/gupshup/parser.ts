import { GupshupInboundPayload, GupshupStatusPayload, ParsedButtonResponse, ParsedStatusEvent } from "./types.js";
import { normalizePhone } from "../../utils/phone.js";

export function isInboundMessage(payload: any): payload is GupshupInboundPayload {
  const innerType = payload?.payload?.type;
  // Confirmed from live traffic: Gupshup sends "quick_reply" for template
  // button taps. button_reply/list_reply kept as a fallback for other
  // interactive message types that may use those names instead.
  return (
    payload?.type === "message" &&
    (innerType === "quick_reply" || innerType === "button_reply" || innerType === "list_reply")
  );
}

export function isStatusEvent(payload: any): payload is GupshupStatusPayload {
  const innerType = payload?.payload?.type;
  return (
    payload?.type === "message-event" &&
    ["enqueued", "sent", "delivered", "read", "failed"].includes(innerType)
  );
}

// Gupshup's documented examples use millisecond timestamps (13 digits); guard
// against a 10-digit (seconds) value in case an older format is ever seen.
function parseTimestamp(ts: number): Date {
  return new Date(ts > 1e12 ? ts : ts * 1000);
}

export function parseButtonResponse(payload: GupshupInboundPayload): ParsedButtonResponse {
  const inner = payload.payload;
  const buttonPayload =
    inner.payload?.id || inner.payload?.postbackText || inner.payload?.title || inner.payload?.text || "";
  const buttonText = inner.payload?.title || inner.payload?.text || buttonPayload;
  const source = inner.source || inner.sender?.phone || "";

  return {
    phone: normalizePhone(source),
    buttonPayload,
    buttonText,
    messageId: inner.id,
    timestamp: parseTimestamp(payload.timestamp),
  };
}

export function parseStatusEvent(payload: GupshupStatusPayload): ParsedStatusEvent {
  const inner = payload.payload;
  const status = inner.type === "enqueued" ? "queued" : inner.type === "read" ? "delivered" : (inner.type as "sent" | "delivered" | "failed");

  return {
    phone: normalizePhone(inner.destination),
    messageId: inner.id,
    status,
    errorCode: inner.payload?.code !== undefined ? String(inner.payload.code) : undefined,
    errorMessage: inner.payload?.reason,
    timestamp: parseTimestamp(payload.timestamp),
  };
}

export function maskPhone(phone: string): string {
  if (phone.length <= 6) return "****";
  return phone.slice(0, 3) + "****" + phone.slice(-2);
}
