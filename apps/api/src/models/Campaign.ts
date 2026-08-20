import mongoose, { Schema, Document } from "mongoose";
import { CampaignStatus, CampaignType } from "@garbha-gudi/shared";

export interface ICampaign extends Document {
  campaignId: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  templateId?: string;
  templateName?: string;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalYes: number;
  totalNo: number;
  totalPending: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    campaignId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: Object.values(CampaignType), default: CampaignType.Attendance },
    status: { type: String, enum: Object.values(CampaignStatus), default: CampaignStatus.Draft },
    templateId: { type: String },
    templateName: { type: String },
    totalRecipients: { type: Number, default: 0 },
    totalSent: { type: Number, default: 0 },
    totalDelivered: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    totalYes: { type: Number, default: 0 },
    totalNo: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model<ICampaign>("Campaign", campaignSchema);
