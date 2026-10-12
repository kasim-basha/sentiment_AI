import { Router } from "express";
import { reportController } from "../controllers/reportController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateUser, reportController.listReports);
router.get("/:id", authenticateUser, reportController.getReportById);
router.post("/", authenticateUser, reportController.createReport);
router.delete("/:id", authenticateUser, reportController.deleteReport);

export const reportRoutes = router;
