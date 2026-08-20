import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { AdminUser } from "../models/AdminUser.js";
import { Donor } from "../models/Donor.js";
import { Campaign } from "../models/Campaign.js";
import { CampaignRecipient } from "../models/CampaignRecipient.js";
import { normalizePhone } from "../utils/phone.js";
import { env } from "../config/env.js";
import { v4 as uuidv4 } from "uuid";

const FAKE_DONORS = [
  { name: "Rajesh Kumar", phone: "9876543210", donationAmount: 5000, brickName: "B1", donationReference: "REF001" },
  { name: "Priya Sharma", phone: "9876543211", donationAmount: 10000, brickName: "B2", donationReference: "REF002" },
  { name: "Arun Patel", phone: "9876543212", donationAmount: 2500, donationReference: "REF003" },
  { name: "Lakshmi Devi", phone: "9876543213", donationAmount: 15000, brickName: "B3", donationReference: "REF004" },
  { name: "Suresh Babu", phone: "9876543214", donationAmount: 7500, brickName: "B4", donationReference: "REF005" },
  { name: "Anitha Reddy", phone: "9876543215", donationAmount: 3000, donationReference: "REF006" },
  { name: "Venkat Rao", phone: "9876543216", donationAmount: 8000, brickName: "B5", donationReference: "REF007" },
  { name: "Meera Joshi", phone: "9876543217", donationAmount: 12000, donationReference: "REF008" },
  { name: "Ganesh Iyer", phone: "9876543218", donationAmount: 4000, brickName: "B6", donationReference: "REF009" },
  { name: "Sunita Nair", phone: "9876543219", donationAmount: 6000, donationReference: "REF010" },
  { name: "Mohammed Ali", phone: "9876543220", donationAmount: 9000, brickName: "B7", donationReference: "REF011" },
  { name: "Deepa Krishnan", phone: "9876543221", donationAmount: 4500, donationReference: "REF012" },
  { name: "Ravi Verma", phone: "9876543222", donationAmount: 11000, brickName: "B8", donationReference: "REF013" },
  { name: "Kavitha Prasad", phone: "9876543223", donationAmount: 3500, donationReference: "REF014" },
  { name: "Naveen Gowda", phone: "9876543224", donationAmount: 7000, brickName: "B9", donationReference: "REF015" },
  { name: "Pooja Singh", phone: "9876543225", donationAmount: 5500, donationReference: "REF016" },
  { name: "Amit Deshpande", phone: "9876543226", donationAmount: 8500, brickName: "B10", donationReference: "REF017" },
  { name: "Revathi Menon", phone: "9876543227", donationAmount: 6500, donationReference: "REF018" },
  { name: "Karthik Subramanian", phone: "9876543228", donationAmount: 9500, brickName: "B11", donationReference: "REF019" },
  { name: "Divya Bhat", phone: "9876543229", donationAmount: 4200, donationReference: "REF020" },
];

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for seeding");

  await AdminUser.deleteMany({});
  await Donor.deleteMany({});
  await Campaign.deleteMany({});
  await CampaignRecipient.deleteMany({});

  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await AdminUser.create({
    name: "Admin",
    email: "admin@garbhagudi.com",
    passwordHash,
    role: "admin",
  });
  console.log("Admin created: admin@garbhagudi.com / admin123");

  const donors = await Donor.insertMany(
    FAKE_DONORS.map((d) => ({
      ...d,
      phone: normalizePhone(d.phone),
      donorId: "DONOR-" + uuidv4().slice(0, 8).toUpperCase(),
    }))
  );
  console.log(donors.length + " donors created");

  const campaign = await Campaign.create({
    campaignId: uuidv4(),
    name: "Garbha Gudi Attendance 2026",
    description: "Attendance confirmation for Garbha Gudi construction occasion",
    type: "attendance",
    status: "draft",
    createdBy: admin._id,
  });
  console.log("Campaign created: " + campaign.name);

  const recipients = await CampaignRecipient.insertMany(
    donors.map((d) => ({
      campaignId: campaign._id,
      donorId: d._id,
      phone: d.phone,
    }))
  );
  console.log(recipients.length + " campaign recipients created");

  await Campaign.findByIdAndUpdate(campaign._id, { totalRecipients: recipients.length });

  console.log("\nSeed complete!");
  console.log("Login: admin@garbhagudi.com / admin123");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
