import mongoose from "mongoose";
import { Donor, IDonor } from "../models/Donor.js";
import { BrickIssuance } from "../models/BrickIssuance.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { normalizePhone } from "../utils/phone.js";
import { emitAppEvent } from "../utils/events.js";

interface DonorListParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  brickStatus?: string;
}

export async function listDonors({ page, limit, search, sort, brickStatus }: DonorListParams) {
  const donorMatch: Record<string, unknown> = {};
  if (search) {
    donorMatch.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { donorId: { $regex: search, $options: "i" } },
    ];
  }

  const sortObj: Record<string, 1 | -1> = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
  const skip = (page - 1) * limit;

  // brickStatus lives on CampaignRecipient, not Donor, so this needs a join —
  // a donor matches a brickStatus filter if ANY of their recipient records
  // has that status. Always joined (not just when filtering) so the list can
  // also display each donor's brick status.
  const pipeline: mongoose.PipelineStage[] = [
    { $match: donorMatch },
    {
      $lookup: {
        from: "campaignrecipients",
        localField: "_id",
        foreignField: "donorId",
        as: "recipients",
      },
    },
  ];

  if (brickStatus) {
    pipeline.push({ $match: { "recipients.brickStatus": brickStatus } });
  }

  pipeline.push(
    { $addFields: { brickStatus: { $arrayElemAt: ["$recipients.brickStatus", 0] } } },
    { $project: { recipients: 0 } },
    { $sort: sortObj }
  );

  const countResult = await Donor.aggregate([...pipeline, { $count: "total" }]);
  const total = countResult[0]?.total || 0;

  const data = await Donor.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]);

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
