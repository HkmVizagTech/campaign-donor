import { Router } from "express";
import {
  create, list, getById, update,
  addRecipients, getRecipients,
  updateResponse, updateBrickStatus,
  getStats, dashboard,
} from "../controllers/campaign.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Dashboard
router.get("/dashboard", dashboard);

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

// Stats
router.get("/:id/stats", getStats);

export default router;
