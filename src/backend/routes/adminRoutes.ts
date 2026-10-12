import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// All Admin routes require Admin authorization
router.use(requireAdmin);

router.get("/users", adminController.getUsers);
router.put("/users/:id/status", adminController.updateUserStatus);
router.put("/users/:id/role", adminController.updateUserRole);

router.get("/analyses", adminController.getAnalyses);
router.get("/reports", adminController.getReports);
router.get("/statistics", adminController.getStatistics);
router.get("/system", adminController.getSystemInfo);

router.get("/community/reports", adminController.getCommunityReports);
router.post("/community/reports/:id/action", adminController.actionCommunityReport);

router.get("/audit-logs", adminController.getAuditLogs);

export const adminRoutes = router;
