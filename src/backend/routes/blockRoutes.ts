import { Router } from "express";
import { blockController } from "../controllers/blockController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateUser);

router.get("/", blockController.getBlockedUsers);
router.post("/:userId", blockController.blockUser);
router.delete("/:userId", blockController.unblockUser);

export const blockRoutes = router;
