import mongoose from "mongoose";
import { normalizePhone, isValidPhone } from "../utils/phone.js";
import { Donor, IDonor } from "../models/Donor.js";
import { ImportBatch } from "../models/ImportBatch.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { ImportBatchStatus } from "@garbha-gudi/shared";
import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";

interface ImportRow {
  [key: string]: string | number | undefined;
}

interface ParsedData {
  headers: string[];
  rows: ImportRow[];
  totalRows: number;
}

export function parseFile(buffer: Buffer, fileName: string): ParsedData {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new BadRequestError("File contains no sheets");

  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });

  if (jsonData.length === 0) throw new BadRequestError("File contains no data rows");

  const headers = Object.keys(jsonData[0]);
  return { headers, rows: jsonData, totalRows: jsonData.length };
}

function mapRow(row: ImportRow, mapping: Record<string, string>) {
  const mapped: Record<string, string | number | undefined> = {};
  for (const [field, column] of Object.entries(mapping)) {
    if (column && row[column] !== undefined) {
      mapped[field] = row[column];
    }
  }
  return mapped;
}

interface ValidateResult {
  valid: Array<{ data: Record<string, string | number | undefined>; rowNumber: number }>;
  errors: Array<{ row: number; field: string; message: string }>;
  duplicatePhones: Set<string>;
}

function validateRows(rows: ImportRow[], mapping: Record<string, string>): ValidateResult {
  const result: ValidateResult = { valid: [], errors: [], duplicatePhones: new Set() };
  const phoneCount = new Map<string, number>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 for 1-indexed + header row
    const mapped = mapRow(row, mapping);

    if (!mapped.name || String(mapped.name).trim() === "") {
      result.errors.push({ row: rowNumber, field: "name", message: "Name is required" });
      return;
    }

    if (!mapped.phone || String(mapped.phone).trim() === "") {
      result.errors.push({ row: rowNumber, field: "phone", message: "Phone is required" });
      return;
    }

    const phone = normalizePhone(String(mapped.phone));
    if (!isValidPhone(phone)) {
      result.errors.push({ row: rowNumber, field: "phone", message: `Invalid phone: ${mapped.phone}` });
      return;
    }

    mapped.phone = phone;
    const count = phoneCount.get(phone) || 0;
    phoneCount.set(phone, count + 1);

    if (mapped.donationAmount) {
      const amt = Number(mapped.donationAmount);
      if (isNaN(amt)) {
        result.errors.push({ row: rowNumber, field: "donationAmount", message: "Invalid amount" });
        return;
      }
      mapped.donationAmount = amt;
    }

    if (mapped.donationDate) {
      const date = new Date(String(mapped.donationDate));
      if (isNaN(date.getTime())) {
        result.errors.push({ row: rowNumber, field: "donationDate", message: "Invalid date" });
        return;
      }
      mapped.donationDate = date.toISOString();
    }

    result.valid.push({ data: mapped, rowNumber });
  });

  for (const [phone, count] of phoneCount) {
    if (count > 1) result.duplicatePhones.add(phone);
  }

  return result;
}

export async function importDonors(
  buffer: Buffer,
  fileName: string,
  mapping: Record<string, string>,
  adminId: string
) {
  const parsed = parseFile(buffer, fileName);
  const { valid, errors, duplicatePhones } = validateRows(parsed.rows, mapping);

  const batch = await ImportBatch.create({
    batchId: uuidv4(),
    fileName,
    totalRows: parsed.totalRows,
    successfulRows: 0,
    failedRows: errors.length,
    duplicateRows: 0,
    status: ImportBatchStatus.Processing,
    errors: errors.slice(0, 100), // cap error list
    importedBy: adminId,
  });

  let insertedCount = 0;
  let duplicateCount = 0;

  for (const { data } of valid) {
    const donorData: Partial<IDonor> = {
      name: String(data.name).trim(),
      phone: normalizePhone(String(data.phone)),
      source: fileName,
      importBatchId: batch._id,
    };
    if (data.email) donorData.email = String(data.email).trim();
    if (data.address) donorData.address = String(data.address).trim();
    if (data.donationAmount) donorData.donationAmount = Number(data.donationAmount);
    if (data.donationDate) donorData.donationDate = new Date(String(data.donationDate));
    if (data.donationReference) donorData.donationReference = String(data.donationReference).trim();
    if (data.brickName) donorData.brickName = String(data.brickName).trim();
    if (data.donorId) donorData.donorId = String(data.donorId).trim();
    if (data.notes) donorData.notes = String(data.notes).trim();

    try {
      await Donor.create(donorData);
      insertedCount++;
    } catch (err: any) {
      if (err.code === 11000) {
        duplicateCount++;
      } else {
        errors.push({ row: 0, field: "general", message: err.message });
      }
    }
  }

  // Update duplicate phone flags
  if (duplicatePhones.size > 0) {
    const dupeDonors = await Donor.find({
      phone: { $in: Array.from(duplicatePhones) },
      importBatchId: batch._id,
    });
    const phoneToFirst = new Map<string, mongoose.Types.ObjectId>();
    for (const d of dupeDonors) {
      if (phoneToFirst.has(d.phone)) {
        d.duplicatePhoneGroup = phoneToFirst.get(d.phone)!;
        await d.save();
      } else {
        phoneToFirst.set(d.phone, d._id);
      }
    }
  }

  batch.successfulRows = insertedCount;
  batch.duplicateRows = duplicateCount;
  batch.status = ImportBatchStatus.Completed;
  batch.validationErrors = errors.slice(0, 100);
  await batch.save();

  return {
    batch,
    summary: {
      totalRows: parsed.totalRows,
      inserted: insertedCount,
      duplicates: duplicateCount,
      failed: errors.length,
      duplicatePhones: duplicatePhones.size,
    },
  };
}

export async function getImportBatches() {
  return ImportBatch.find().sort({ createdAt: -1 });
}

export async function getImportBatchById(id: string) {
  const batch = await ImportBatch.findById(id);
  if (!batch) throw new NotFoundError("Import batch not found");
  return batch;
}
