import { Router } from "express";
import { list, getById, update, create, issueBrick, getBrickIssuances } from "../controllers/donor.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.post("/", create);
router.get("/", list);
router.get("/:id", getById);
router.put("/:id", update);
router.post("/:id/bricks", issueBrick);
router.get("/:id/bricks", getBrickIssuances);

export default router;
