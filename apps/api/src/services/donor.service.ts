import ExcelJS from "exceljs";
import { Donor, IDonor } from "../models/Donor.js";
import { BrickIssuance } from "../models/BrickIssuance.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { normalizePhone } from "../utils/phone.js";
import { emitAppEvent } from "../utils/events.js";

const BRICK_LABELS: Record<string, string> = {
  not_required: "N/A",
  pending: "Pending",
  confirmed: "Confirmed",
  prepared: "Prepared",
  handed_over: "Handed Over",
};

interface DonorListParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  brickStatus?: string;
}

export async function listDonors({ page, limit, search, sort, brickStatus }: DonorListParams) {
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { donorId: { $regex: search, $options: "i" } },
    ];
  }
  // brickStatus is denormalized onto Donor (kept in sync by
  // updateBrickStatus/addRecipients in campaign.service.ts) specifically so
  // this stays a plain indexed query — no live join against
  // campaignrecipients, which was the source of an earlier slowdown.
  if (brickStatus) {
    filter.brickStatus = brickStatus;
  }

  const sortObj: Record<string, 1 | -1> = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Donor.find(filter).sort(sortObj).skip(skip).limit(limit),
    Donor.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDonorById(id: string): Promise<IDonor> {
  const donor = await Donor.findById(id);
  if (!donor) throw new NotFoundError("Donor not found");
  return donor;
}

export async function updateDonor(id: string, updates: Partial<IDonor>): Promise<IDonor> {
  if (updates.phone) updates.phone = normalizePhone(updates.phone);
  const donor = await Donor.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!donor) throw new NotFoundError("Donor not found");
  return donor;
}

export async function createDonor(data: { name: string; phone: string; donationAmount?: number; donationReference?: string; brickName?: string; sevaCategory?: string }): Promise<IDonor> {
  const { v4: uuidv4 } = await import("uuid");
  const donor = await Donor.create({
    ...data,
    phone: normalizePhone(data.phone),
    donorId: "DONOR-" + uuidv4().slice(0, 8).toUpperCase(),
  });
  emitAppEvent({});
  return donor;
}

export async function getDonorCount(): Promise<number> {
  return Donor.countDocuments();
}

export async function issueBrick(
  donorId: string,
  data: { type: "free" | "paid"; referenceNumber: string; amount?: number },
  adminId: string
) {
  const donor = await Donor.findById(donorId);
  if (!donor) throw new NotFoundError("Donor not found");

  if (!data.referenceNumber?.trim()) {
    throw new BadRequestError("Reference number is required to issue a brick");
  }
  if (data.type !== "free" && data.type !== "paid") {
    throw new BadRequestError("Type must be 'free' or 'paid'");
  }

  const issuance = await BrickIssuance.create({
    donorId,
    type: data.type,
    referenceNumber: data.referenceNumber.trim(),
    amount: data.type === "paid" ? data.amount : undefined,
    issuedBy: adminId,
  });

  emitAppEvent({});
  return issuance;
}

export async function getBrickIssuances(donorId: string) {
  return BrickIssuance.find({ donorId }).sort({ createdAt: -1 });
}

export async function exportDonors(search?: string, brickStatus?: string) {
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { donorId: { $regex: search, $options: "i" } },
    ];
  }
  if (brickStatus) {
    filter.brickStatus = brickStatus;
  }

  const donors = await Donor.find(filter).sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Donors");

  sheet.columns = [
    { header: "Donor ID", key: "donorId", width: 15 },
    { header: "Name", key: "name", width: 25 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Seva Category", key: "sevaCategory", width: 18 },
    { header: "Brick No", key: "brickName", width: 15 },
    { header: "Brick Status", key: "brickStatusLabel", width: 15 },
    { header: "Handed Over", key: "handedOver", width: 12 },
    { header: "Donation Amount", key: "donationAmount", width: 15 },
    { header: "Donation Reference", key: "donationReference", width: 20 },
    { header: "Source", key: "source", width: 15 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const d of donors) {
    sheet.addRow({
      donorId: d.donorId || "",
      name: d.name,
      phone: d.phone,
      sevaCategory: d.sevaCategory || "",
      brickName: d.brickName || "",
      brickStatusLabel: d.brickStatus ? BRICK_LABELS[d.brickStatus] || d.brickStatus : "",
      handedOver: d.brickStatus === "handed_over" ? "Yes" : "No",
      donationAmount: d.donationAmount || "",
      donationReference: d.donationReference || "",
      source: d.source || "",
    });
  }

  const buffer = Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
  const date = new Date().toISOString().split("T")[0];
  const filename = `donors-${date}.xlsx`;

  return { buffer, filename };
}
