import { Router } from "express";
import { goalController } from "../controllers/goalController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

// All goals endpoints require authenticated user context
router.use(authenticateUser);

router.get("/", goalController.getGoals);
router.post("/", goalController.createGoal);
router.get("/:id", goalController.getGoalById);
router.patch("/:id", goalController.updateGoal);
router.delete("/:id", goalController.deleteGoal);
router.post("/:id/pause", goalController.pauseGoal);
router.post("/:id/resume", goalController.resumeGoal);
router.get("/:id/progress", goalController.getGoalProgress);

export const goalRoutes = router;
