import { Router } from "express";
import { resetAllData } from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.post("/reset-data", resetAllData);

export default router;
