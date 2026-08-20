import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import donorRoutes from "./routes/donor.routes.js";
import importBatchRoutes from "./routes/importBatch.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import exportRoutes from "./routes/export.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      env.FRONTEND_URL,
      "https://campaign-donor-web.vercel.app",
      "https://campaign-donor-jfjazghvc-hkmvizags-projects.vercel.app",
      "http://localhost:3000",
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Webhook routes mounted BEFORE global JSON parser
// so the webhook's own express.json with rawBody capture works
const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many webhook requests" },
});

app.get("/api/webhooks", (_req, res) => {
  res.status(200).end();
});

app.use("/api/webhooks", webhookRateLimit, webhookRoutes);

// Global JSON parser for admin routes
app.use(express.json({ limit: "10mb" }));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

// Temporary seed endpoint — remove after seeding
app.get("/api/seed", async (_req, res) => {
  try {
    const mongoose = await import("mongoose");
    const bcryptModule = await import("bcryptjs");
    const bcrypt = bcryptModule.default || bcryptModule;
    const { AdminUser } = await import("./models/AdminUser.js");
    const { Donor } = await import("./models/Donor.js");
    const { Campaign } = await import("./models/Campaign.js");
    const { CampaignRecipient } = await import("./models/CampaignRecipient.js");
    const { normalizePhone } = await import("./utils/phone.js");
    const { v4: uuidv4 } = await import("uuid");

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

    const donors = await Donor.insertMany(
      FAKE_DONORS.map((d) => ({
        ...d,
        phone: normalizePhone(d.phone),
        donorId: "DONOR-" + uuidv4().slice(0, 8).toUpperCase(),
      }))
    );

    const campaign = await Campaign.create({
      campaignId: uuidv4(),
      name: "Garbha Gudi Attendance 2026",
      description: "Attendance confirmation for Garbha Gudi construction occasion",
      type: "attendance",
      status: "draft",
      createdBy: admin._id,
    });

    const recipients = await CampaignRecipient.insertMany(
      donors.map((d) => ({
        campaignId: campaign._id,
        donorId: d._id,
        phone: d.phone,
      }))
    );

    await Campaign.findByIdAndUpdate(campaign._id, { totalRecipients: recipients.length });

    res.json({
      success: true,
      message: "Seed complete",
      data: {
        admin: "admin@garbhagudi.com / admin123",
        donors: donors.length,
        campaign: campaign.name,
        recipients: recipients.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/import-batches", importBatchRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/reports", exportRoutes);

app.use(errorHandler);

export default app;
