import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const donorCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  donationAmount: z.number().optional(),
  donationDate: z.string().optional(),
  donationReference: z.string().optional(),
  brickName: z.string().optional(),
  sevaCategory: z.string().optional(),
  notes: z.string().optional(),
});

export const donorUpdateSchema = donorCreateSchema.partial();

export const campaignCreateSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  type: z.enum(["attendance", "fundraising", "general"]).default("attendance"),
  templateId: z.string().optional(),
  templateName: z.string().optional(),
});

// Message variables are filled in at send time, not campaign creation —
// see sendCampaign / the campaign detail page's Send Messages modal.
export const sendCampaignSchema = z.object({
  headerImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  templateVariables: z.array(z.string()).optional(),
  nameVariableIndex: z.number().optional(),
});

export const campaignUpdateSchema = campaignCreateSchema.partial().extend({
  status: z.enum(["draft", "ready", "sending", "paused", "completed", "cancelled"]).optional(),
});

export const addRecipientsSchema = z.object({
  donorIds: z.array(z.string()).optional(),
  addAll: z.boolean().optional(),
  importBatchId: z.string().optional(),
});

export const responseUpdateSchema = z.object({
  response: z.enum(["yes", "no"]),
});

export const brickStatusUpdateSchema = z.object({
  brickStatus: z.enum(["not_required", "pending", "confirmed", "prepared", "handed_over"]),
});

export const columnMappingSchema = z.object({
  name: z.string().min(1, "Name column is required"),
  phone: z.string().min(1, "Phone column is required"),
  donorId: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  donationAmount: z.string().optional(),
  donationDate: z.string().optional(),
  donationReference: z.string().optional(),
  brickName: z.string().optional(),
  sevaCategory: z.string().optional(),
  notes: z.string().optional(),
});
