import { Router } from "express";
import { list, getById, update } from "../controllers/donor.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", list);
router.get("/:id", getById);
router.put("/:id", update);

export default router;
