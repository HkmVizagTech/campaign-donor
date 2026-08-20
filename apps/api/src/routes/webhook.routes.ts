import { Router } from "express";
import { handleGupshupWebhook } from "../controllers/webhook.controller.js";
import { verifyGupshupSignature, WebhookRequest } from "../middleware/webhookAuth.js";
import express from "express";

const router = Router();

// Dedicated sub-router for Gupshup that captures raw body before JSON parsing.
// express.json's verify callback gives us the raw Buffer for HMAC checking,
// then the parsed object lands in req.body as normal.
const gupshupRouter = express.Router();

gupshupRouter.use(
  express.json({
    type: "application/json",
    limit: "512kb",
    verify: (req: any, _res, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);

gupshupRouter.post(
  "/",
  verifyGupshupSignature as any,
  handleGupshupWebhook as any
);

router.use("/gupshup", gupshupRouter);

export default router;
