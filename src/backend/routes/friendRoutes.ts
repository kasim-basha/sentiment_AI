import { Router } from "express";
import { friendController } from "../controllers/friendController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateUser);

// Requests
router.post("/requests", friendController.sendFriendRequest);
router.get("/requests", friendController.getFriendRequests);
router.post("/requests/:id/accept", friendController.acceptFriendRequest);
router.post("/requests/:id/reject", friendController.rejectFriendRequest);
router.delete("/requests/:id", friendController.cancelFriendRequest);

// Friends list & delete
router.get("/", friendController.getFriends);
router.delete("/:friendId", friendController.removeFriend);

export const friendRoutes = router;
