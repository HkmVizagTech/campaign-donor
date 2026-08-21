import { Router } from "express";
import { streamEvents } from "../controllers/events.controller.js";
import { authenticateEventStream } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateEventStream, streamEvents);

export default router;
