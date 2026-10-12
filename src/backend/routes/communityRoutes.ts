import { Router } from "express";
import { communityController } from "../controllers/communityController";
import { authenticateUser, optionalAuth } from "../middleware/authMiddleware";

const router = Router();

// Posts
router.get("/posts", optionalAuth, communityController.listPosts);
router.post("/posts", authenticateUser, communityController.createPost);
router.get("/posts/:id", optionalAuth, communityController.getPostById);
router.put("/posts/:id", authenticateUser, communityController.updatePost);
router.delete("/posts/:id", authenticateUser, communityController.deletePost);

// Comments
router.post("/posts/:id/comments", authenticateUser, communityController.createComment);
router.put("/comments/:id", authenticateUser, communityController.updateComment);
router.delete("/comments/:id", authenticateUser, communityController.deleteComment);

// Likes
router.post("/posts/:id/like", authenticateUser, communityController.toggleLike);
router.delete("/posts/:id/like", authenticateUser, communityController.toggleLike);

// Community Trust & Safety Flagging
router.post("/reports", authenticateUser, communityController.createCommunityReport);

export const communityRoutes = router;
