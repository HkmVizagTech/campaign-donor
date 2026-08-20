import { Router } from "express";
import { handleGupshupWebhook } from "../controllers/webhook.controller.js";
import { verifyGupshupSignature, WebhookRequest } from "../middleware/webhookAuth.js";
import express from "express";

const router = Router();

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

gupshupRouter.get("/", (_req, res) => {
  res.status(200).end();
});

gupshupRouter.post(
  "/",
  verifyGupshupSignature as any,
  handleGupshupWebhook as any
);

router.use("/gupshup", gupshupRouter);

export default router;
