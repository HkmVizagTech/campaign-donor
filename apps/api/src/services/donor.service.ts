import { Donor, IDonor } from "../models/Donor.js";
import { NotFoundError } from "../utils/errors.js";
import { normalizePhone } from "../utils/phone.js";

interface DonorListParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
}

export async function listDonors({ page, limit, search, sort }: DonorListParams) {
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { donorId: { $regex: search, $options: "i" } },
    ];
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

export async function getDonorCount(): Promise<number> {
  return Donor.countDocuments();
}
