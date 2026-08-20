export enum ResponseStatus {
  Pending = "pending",
  Yes = "yes",
  No = "no",
}

export enum MessageStatus {
  NotSent = "not_sent",
  Queued = "queued",
  Sent = "sent",
  Delivered = "delivered",
  Failed = "failed",
}

export enum BrickStatus {
  NotRequired = "not_required",
  Pending = "pending",
  Confirmed = "confirmed",
  Prepared = "prepared",
  HandedOver = "handed_over",
}

export enum CampaignStatus {
  Draft = "draft",
  Ready = "ready",
  Sending = "sending",
  Paused = "paused",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum CampaignType {
  Attendance = "attendance",
  Fundraising = "fundraising",
  General = "general",
}

export enum ImportBatchStatus {
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
}

export enum UserRole {
  Admin = "admin",
  SuperAdmin = "super_admin",
}
