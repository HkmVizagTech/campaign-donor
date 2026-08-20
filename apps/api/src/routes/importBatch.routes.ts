import { Router } from "express";
import { upload as uploadCtrl, list, getById, preview } from "../controllers/import.controller.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(authenticate);
router.post("/import", upload.single("file"), uploadCtrl);
router.post("/preview", upload.single("file"), preview);
router.get("/", list);
router.get("/:id", getById);

export default router;
