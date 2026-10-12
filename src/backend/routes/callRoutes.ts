import { Router } from "express";
import { callController } from "../controllers/callController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateUser);

router.post("/", callController.initiateCall);
router.get("/", callController.getCallHistory);
router.get("/:id", callController.getCallSession);
router.post("/:id/accept", callController.acceptCall);
router.post("/:id/reject", callController.rejectCall);
router.post("/:id/end", callController.endCall);
router.post("/:id/signal", callController.sendSignal);

export const callRoutes = router;
