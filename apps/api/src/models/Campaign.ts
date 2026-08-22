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
  headerImageUrl?: string;
  // Positional values for the template's {{1}}..{{n}} body variables, fetched
  // and filled in at send time based on the template's actual variable count.
  templateVariables?: string[];
  // 0-indexed position within templateVariables that gets replaced with the
  // donor's name per recipient; -1 (or unset) means no personalized slot.
  nameVariableIndex?: number;
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
    headerImageUrl: { type: String, trim: true },
    templateVariables: { type: [String], default: undefined },
    nameVariableIndex: { type: Number, default: -1 },
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
