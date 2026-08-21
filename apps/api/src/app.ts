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
  exposedHeaders: ["Content-Disposition"],
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

app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/import-batches", importBatchRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/reports", exportRoutes);

app.use(errorHandler);

export default app;
