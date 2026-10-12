import { Router } from "express";
import { userController } from "../controllers/userController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateUser);

router.get("/search", userController.searchUsers);

export const userRoutes = router;
