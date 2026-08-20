export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
] as const;

export const BRICK_STATUS_LABELS: Record<string, string> = {
  not_required: "Not Required",
  pending: "Pending",
  confirmed: "Confirmed",
  prepared: "Prepared",
  handed_over: "Handed Over",
};

export const RESPONSE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  yes: "YES",
  no: "NO",
};

export const MESSAGE_STATUS_LABELS: Record<string, string> = {
  not_sent: "Not Sent",
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  failed: "Failed",
};

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  sending: "Sending",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};
