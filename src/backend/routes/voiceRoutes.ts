import { Router } from "express";
import { voiceController } from "../controllers/voiceController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.get("/sessions", authenticateUser, voiceController.listVoiceSessions);
router.post("/sessions", authenticateUser, voiceController.createVoiceSession);

export const voiceRoutes = router;
