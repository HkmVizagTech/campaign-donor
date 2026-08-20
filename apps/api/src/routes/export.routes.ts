import { Router } from "express";
import { exportCampaign } from "../controllers/export.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/:id/export", exportCampaign);

export default router;
