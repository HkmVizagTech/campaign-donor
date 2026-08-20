import ExcelJS from "exceljs";
import { CampaignRecipient } from "../models/CampaignRecipient.js";
import { Donor } from "../models/Donor.js";
import { Campaign } from "../models/Campaign.js";
import mongoose from "mongoose";

interface ExportParams {
  campaignId: string;
  response?: string;
  format: "xlsx" | "csv";
}

export async function exportCampaignData({ campaignId, response, format }: ExportParams) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const filter: Record<string, unknown> = { campaignId };
  if (response) filter.response = response;

  const recipients = await CampaignRecipient.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: "donors",
        localField: "donorId",
        foreignField: "_id",
        as: "donor",
      },
    },
    { $unwind: { path: "$donor", preserveNullAndEmptyArrays: true } },
    { $sort: { "donor.name": 1 } },
  ]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Donors");

  sheet.columns = [
    { header: "Donor ID", key: "donorId", width: 15 },
    { header: "Name", key: "name", width: 25 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Brick Name", key: "brickName", width: 20 },
    { header: "Donation Reference", key: "donationReference", width: 20 },
    { header: "Donation Amount", key: "donationAmount", width: 15 },
    { header: "Response", key: "response", width: 12 },
    { header: "Response Date", key: "responseAt", width: 20 },
    { header: "Brick Status", key: "brickStatus", width: 15 },
    { header: "Message Status", key: "messageStatus", width: 15 },
  ];

  // Style header row
  sheet.getRow(1).font = { bold: true };

  for (const r of recipients) {
    const donor = r.donor || {};
    sheet.addRow({
      donorId: donor.donorId || "",
      name: donor.name || "",
      phone: r.phone || "",
      brickName: donor.brickName || "",
      donationReference: donor.donationReference || "",
      donationAmount: donor.donationAmount || "",
      response: r.response,
      responseAt: r.responseAt ? new Date(r.responseAt).toLocaleDateString() : "",
      brickStatus: r.brickStatus,
      messageStatus: r.messageStatus,
    });
  }

  let buffer: Buffer;
  let contentType: string;
  let extension: string;

  if (format === "csv") {
    const csvString = await workbook.csv.writeBuffer();
    buffer = Buffer.from(csvString as ArrayBuffer);
    contentType = "text/csv";
    extension = "csv";
  } else {
    buffer = Buffer.from(await workbook.xlsx.writeBuffer() as ArrayBuffer);
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    extension = "xlsx";
  }

  const suffix = response ? `-${response}` : "-all";
  const date = new Date().toISOString().split("T")[0];
  const filename = `garbha-gudi${suffix}-donors-${date}.${extension}`;

  return { buffer, contentType, filename };
}
