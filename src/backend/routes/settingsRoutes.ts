import { Router } from "express";
import { settingsController } from "../controllers/settingsController";
import { privacyController } from "../controllers/privacyController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateUser, settingsController.getSettings);
router.put("/", authenticateUser, settingsController.updateSettings);

// Privacy endpoints under /api/settings/privacy
router.get("/privacy", authenticateUser, privacyController.getPrivacySettings);
router.patch("/privacy", authenticateUser, privacyController.updatePrivacySettings);
router.put("/privacy", authenticateUser, privacyController.updatePrivacySettings);

export const settingsRoutes = router;
