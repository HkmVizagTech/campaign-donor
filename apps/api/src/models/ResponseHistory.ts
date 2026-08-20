import mongoose, { Schema, Document } from "mongoose";
import { ResponseStatus } from "@garbha-gudi/shared";

export interface IResponseHistory extends Document {
  campaignId: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  previousResponse?: ResponseStatus;
  newResponse: ResponseStatus;
  source: "whatsapp" | "admin";
  changedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const responseHistorySchema = new Schema<IResponseHistory>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    donorId: { type: Schema.Types.ObjectId, ref: "Donor", required: true },
    previousResponse: { type: String, enum: Object.values(ResponseStatus) },
    newResponse: { type: String, enum: Object.values(ResponseStatus), required: true },
    source: { type: String, enum: ["whatsapp", "admin"], required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

responseHistorySchema.index({ campaignId: 1, donorId: 1 });

export const ResponseHistory = mongoose.model<IResponseHistory>(
  "ResponseHistory",
  responseHistorySchema
);
