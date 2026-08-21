import mongoose, { Schema, Document } from "mongoose";

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
  },
  { timestamps: true }
);

donorSchema.index({ name: "text", donorId: "text" });
donorSchema.index({ donorId: 1 }, { sparse: true, unique: true });

export const Donor = mongoose.model<IDonor>("Donor", donorSchema);
