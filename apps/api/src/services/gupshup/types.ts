export interface GupshupInboundPayload {
  type: "message";
  message: {
    id: string;
    source: string;
    type: string;
    text?: string;
    button?: {
      text: string;
      payload: string;
    };
    image?: { url: string };
    video?: { url: string };
    file?: { url: string };
  };
  timestamp: number;
  appId: string;
  version?: string;
}

export interface GupshupStatusPayload {
  type: "message-event";
  messageId: string;
  status: "sent" | "delivered" | "failed" | "unknown";
  destination: string;
  timestamp: number;
  errorCode?: string;
  errorMessage?: string;
  appId?: string;
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
  status: "sent" | "delivered" | "failed";
  errorCode?: string;
  errorMessage?: string;
  timestamp: Date;
}
