// Gupshup's v2 webhook envelope wraps everything under a `payload` key with
// its own `type`, rather than the flatter shape this file used to assume.
// See https://docs.gupshup.io/docs/whatsapp-message-type-inbound and
// https://docs.gupshup.io/docs/message-events

export interface GupshupInboundPayload {
  type: "message";
  app?: string;
  timestamp: number; // milliseconds
  version?: number;
  payload: {
    id: string;
    source: string; // phone, no leading "+"
    type: string; // "button_reply" | "list_reply" | "text" | ...
    // Shape varies by `type`; for button/list replies Gupshup has been seen
    // to use either {id, title} (Meta Cloud API style) or
    // {text, postbackText, refmsgid} — both are checked defensively.
    payload?: {
      id?: string;
      title?: string;
      text?: string;
      postbackText?: string;
      refmsgid?: string;
    };
    sender?: {
      phone: string;
      name?: string;
      country_code?: string;
      dial_code?: string;
    };
  };
}

export interface GupshupStatusPayload {
  type: "message-event";
  app?: string;
  timestamp: number; // milliseconds
  version?: number;
  payload: {
    id: string;
    gsId?: string;
    type: "enqueued" | "sent" | "delivered" | "read" | "failed" | "deleted" | string;
    destination: string; // phone, no leading "+"
    payload?: {
      code?: number | string;
      reason?: string;
    };
  };
}

export type GupshupPayload = GupshupInboundPayload | GupshupStatusPayload;

export interface ParsedButtonResponse {
  phone: string;
  buttonPayload: string;
  buttonText: string;
  messageId: string;
  timestamp: Date;
}

export interface ParsedStatusEvent {
  phone: string;
  messageId: string;
  status: "queued" | "sent" | "delivered" | "failed";
  errorCode?: string;
  errorMessage?: string;
  timestamp: Date;
}
