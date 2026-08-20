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
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// Global JSON parser for admin routes
app.use(express.json({ limit: "10mb" }));

// Separate, stricter rate limit for the webhook endpoint
const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // generous — Gupshup may burst many events
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many webhook requests" },
});

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/import-batches", importBatchRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/reports", exportRoutes);

// Webhook route mounted BEFORE the global error handler.
// It has its own body parser (express.json with verify callback for raw body).
// We still apply a dedicated rate limiter.
app.use("/api/webhooks", webhookRateLimit, webhookRoutes);

app.use(errorHandler);

export default app;
