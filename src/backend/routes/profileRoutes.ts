import { Router } from "express";
import { profileController } from "../controllers/profileController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateUser, profileController.getProfile);
router.put("/", authenticateUser, profileController.updateProfile);

export const profileRoutes = router;
