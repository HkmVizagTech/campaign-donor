import mongoose, { Schema, Document } from "mongoose";
import { ImportBatchStatus } from "@garbha-gudi/shared";

export interface IImportBatch extends Document {
  batchId: string;
  fileName: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateRows: number;
  status: ImportBatchStatus;
  validationErrors: Array<{ row: number; field: string; message: string }>;
  importedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const importBatchSchema = new Schema<IImportBatch>(
  {
    batchId: { type: String, required: true, unique: true },
    fileName: { type: String, required: true },
    totalRows: { type: Number, required: true },
    successfulRows: { type: Number, required: true },
    failedRows: { type: Number, required: true },
    duplicateRows: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(ImportBatchStatus), default: ImportBatchStatus.Processing },
    validationErrors: [{ row: Number, field: String, message: String }],
    importedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ImportBatch = mongoose.model<IImportBatch>("ImportBatch", importBatchSchema);
