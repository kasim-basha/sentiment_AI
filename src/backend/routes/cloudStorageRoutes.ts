import { Router } from "express";
import { cloudStorageController } from "../controllers/cloudStorageController";
import { optionalAuth } from "../middleware/authMiddleware";
import { apiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Cloud Storage endpoints
router.get("/status", optionalAuth, cloudStorageController.getStatus);
router.post("/sync", optionalAuth, apiRateLimiter, cloudStorageController.syncData);
router.get("/records", optionalAuth, cloudStorageController.getRecords);
router.post("/backup", optionalAuth, apiRateLimiter, cloudStorageController.createBackup);

export const cloudStorageRoutes = router;
