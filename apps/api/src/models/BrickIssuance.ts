import mongoose, { Schema, Document } from "mongoose";

export interface IBrickIssuance extends Document {
  donorId: mongoose.Types.ObjectId;
  type: "free" | "paid";
  referenceNumber: string;
  amount?: number;
  issuedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const brickIssuanceSchema = new Schema<IBrickIssuance>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: "Donor", required: true },
    type: { type: String, enum: ["free", "paid"], required: true },
    referenceNumber: { type: String, required: true, trim: true },
    amount: { type: Number },
    issuedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

brickIssuanceSchema.index({ donorId: 1, createdAt: -1 });

export const BrickIssuance = mongoose.model<IBrickIssuance>("BrickIssuance", brickIssuanceSchema);
