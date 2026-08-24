import mongoose, { Schema, Document } from "mongoose";
import { ResponseStatus, MessageStatus, BrickStatus } from "@garbha-gudi/shared";

export interface ICampaignRecipient extends Document {
  campaignId: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  phone: string;
  response: ResponseStatus;
  responseAt?: Date;
  messageStatus: MessageStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  externalMessageId?: string;
  brickStatus: BrickStatus;
  checkedIn: boolean;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campaignRecipientSchema = new Schema<ICampaignRecipient>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    donorId: { type: Schema.Types.ObjectId, ref: "Donor", required: true },
    phone: { type: String, required: true },
    response: { type: String, enum: Object.values(ResponseStatus), default: ResponseStatus.Pending },
    responseAt: { type: Date },
    messageStatus: { type: String, enum: Object.values(MessageStatus), default: MessageStatus.NotSent },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
    externalMessageId: { type: String },
    brickStatus: { type: String, enum: Object.values(BrickStatus), default: BrickStatus.Pending },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
  },
  { timestamps: true }
);

campaignRecipientSchema.index({ campaignId: 1, donorId: 1 }, { unique: true });
campaignRecipientSchema.index({ campaignId: 1, phone: 1 }, { unique: true });
campaignRecipientSchema.index({ phone: 1 });
campaignRecipientSchema.index({ campaignId: 1, response: 1 });

export const CampaignRecipient = mongoose.model<ICampaignRecipient>(
  "CampaignRecipient",
  campaignRecipientSchema
);
