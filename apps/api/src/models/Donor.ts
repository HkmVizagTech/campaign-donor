import mongoose, { Schema, Document } from "mongoose";
import { BrickStatus } from "@garbha-gudi/shared";

export interface IDonor extends Document {
  donorId?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  donationAmount?: number;
  donationDate?: Date;
  donationReference?: string;
  brickName?: string;
  sevaCategory?: string;
  source?: string;
  importBatchId?: mongoose.Types.ObjectId;
  notes?: string;
  duplicatePhoneGroup?: mongoose.Types.ObjectId;
  // Denormalized copy of the donor's (most recent) CampaignRecipient
  // brickStatus, kept in sync by updateBrickStatus/addRecipients in
  // campaign.service.ts. Lets the Donors list filter/display brick status
  // with a plain indexed query instead of joining campaignrecipients live.
  brickStatus?: BrickStatus;
  createdAt: Date;
  updatedAt: Date;
}

const donorSchema = new Schema<IDonor>(
  {
    donorId: { type: String },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    donationAmount: { type: Number },
    donationDate: { type: Date },
    donationReference: { type: String, trim: true },
    brickName: { type: String, trim: true },
    sevaCategory: { type: String, trim: true },
    source: { type: String, trim: true },
    importBatchId: { type: Schema.Types.ObjectId, ref: "ImportBatch" },
    notes: { type: String, trim: true },
    duplicatePhoneGroup: { type: Schema.Types.ObjectId },
    brickStatus: { type: String, enum: Object.values(BrickStatus) },
  },
  { timestamps: true }
);

donorSchema.index({ name: "text", donorId: "text" });
donorSchema.index({ donorId: 1 }, { sparse: true, unique: true });
donorSchema.index({ brickStatus: 1 });

export const Donor = mongoose.model<IDonor>("Donor", donorSchema);
