import { Router } from "express";
import {
  create, list, getById, update,
  addRecipients, getRecipients,
  updateResponse, updateBrickStatus, checkIn,
  getStats, dashboard, send, getTemplateInfo, searchRecipients,
} from "../controllers/campaign.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Dashboard
router.get("/dashboard", dashboard);

// Template info (fetched from Gupshup) — must come before /:id
router.get("/template-info", getTemplateInfo);

// Counter lookup: search recipients across all campaigns — must come before /:id
router.get("/recipients/search", searchRecipients);

// Campaign CRUD
router.get("/", list);
router.post("/", create);
router.get("/:id", getById);
router.put("/:id", update);

// Recipients
router.post("/:id/recipients", addRecipients);
router.get("/:id/recipients", getRecipients);

// Response + Brick
router.put("/:id/recipients/:recipientId/response", updateResponse);
router.put("/:id/recipients/:recipientId/brick", updateBrickStatus);
router.put("/:id/recipients/:recipientId/checkin", checkIn);

// Send
router.post("/:id/send", send);

// Stats
router.get("/:id/stats", getStats);

export default router;
