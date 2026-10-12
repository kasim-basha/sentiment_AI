import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { validators } from "../validators";
import { auditService } from "../services/auditService";
import { PostTable, CommentTable, CommunityReportTable } from "../database/types";

export const communityController = {
  listPosts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user?.id;
      const search = req.query.search ? String(req.query.search) : undefined;
      const tag = req.query.tag ? String(req.query.tag) : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

      const { posts, total } = db.listPosts(currentUserId, { search, tag, page, limit });

      // Attach user-specific isLiked flag
      const enrichedPosts = posts.map(p => ({
        ...p,
        isLiked: currentUserId ? db.isPostLikedByUser(p.postId, currentUserId) : false
      }));

      return res.json({
        success: true,
        posts: enrichedPosts,
        total,
        page,
        limit
      });
    } catch (err) {
      next(err);
    }
  },

  getPostById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;
      const post = db.getPost(id);

      if (!post) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Post not found." }
        });
      }

      // Privacy check
      if (post.privacy === "private" && post.authorId !== currentUserId) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "This post is private." }
        });
      }

      if (post.privacy === "community" && !currentUserId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Log in to view community posts." }
        });
      }

      const comments = db.listComments(id);
      const isLiked = currentUserId ? db.isPostLikedByUser(id, currentUserId) : false;

      return res.json({
        success: true,
        post: {
          ...post,
          isLiked,
          comments
        }
      });
    } catch (err) {
      next(err);
    }
  },

  createPost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const { content, privacy, tags, analysisId } = validators.validatePost(req.body);

      // If linking an analysis, check that user owns it
      let sentimentBadge: any = undefined;
      let metrics: any = undefined;
      if (analysisId) {
        const analysis = db.getAnalysisSession(analysisId);
        if (analysis) {
          if (analysis.userId !== user.id && user.role !== "admin") {
            return res.status(403).json({
              success: false,
              error: { code: "FORBIDDEN", message: "You can only share your own analyses." }
            });
          }
          sentimentBadge = {
            label: analysis.overallSentiment.label,
            dominantEmotion: analysis.emotions?.dominant?.name || "Emotion",
            score: analysis.score
          };
          const inputs = db.getAnalysisInputs(analysisId);
          metrics = {
            confidence: analysis.confidence,
            inputTypes: Array.from(new Set(inputs.map(i => i.inputType)))
          };
        }
      }

      const now = new Date().toISOString();
      const newPost: PostTable = {
        postId: "post_" + Math.random().toString(36).substring(2, 11),
        authorId: user.id,
        authorName: user.name,
        authorEmail: user.email,
        authorRole: user.role,
        content,
        privacy,
        sentimentBadge,
        metrics,
        analysisId,
        tags: tags && tags.length > 0 ? tags : undefined,
        likesCount: 0,
        commentsCount: 0,
        createdAt: now,
        updatedAt: now
      };

      const saved = db.createPost(newPost);

      auditService.log({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "POST_CREATED",
        targetType: "post",
        targetId: saved.postId,
        metadata: { privacy, tags },
        ipAddress: req.ip
      });

      return res.status(201).json({
        success: true,
        post: { ...saved, isLiked: false }
      });
    } catch (err) {
      next(err);
    }
  },

  updatePost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const { content, privacy, tags } = validators.validatePost(req.body);
      const updated = db.updatePost(id, user.id, { content, privacy, tags });

      return res.json({
        success: true,
        post: updated
      });
    } catch (err) {
      next(err);
    }
  },

  deletePost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const isAdmin = user.role === "admin";
      db.deletePost(id, user.id, isAdmin);

      auditService.log({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "POST_DELETED",
        targetType: "post",
        targetId: id,
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: "Post deleted successfully."
      });
    } catch (err) {
      next(err);
    }
  },

  // Comments
  createComment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // postId
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const { content } = validators.validateComment(req.body);
      const now = new Date().toISOString();

      const newComment: CommentTable = {
        commentId: "comm_" + Math.random().toString(36).substring(2, 11),
        postId: id,
        authorId: user.id,
        authorName: user.name,
        authorEmail: user.email,
        authorRole: user.role,
        content,
        createdAt: now,
        updatedAt: now
      };

      const saved = db.createComment(newComment);
      return res.status(201).json({
        success: true,
        comment: saved
      });
    } catch (err) {
      next(err);
    }
  },

  updateComment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // commentId
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const { content } = validators.validateComment(req.body);
      const updated = db.updateComment(id, user.id, content);

      return res.json({
        success: true,
        comment: updated
      });
    } catch (err) {
      next(err);
    }
  },

  deleteComment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // commentId
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const isAdmin = user.role === "admin";
      db.deleteComment(id, user.id, isAdmin);

      return res.json({
        success: true,
        message: "Comment deleted successfully."
      });
    } catch (err) {
      next(err);
    }
  },

  // Likes (1 like per user per post enforced by unique constraint)
  toggleLike: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // postId
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const result = db.toggleLike(id, user.id);
      return res.json({
        success: true,
        liked: result.liked,
        likesCount: result.likesCount
      });
    } catch (err) {
      next(err);
    }
  },

  // Community Reports (Flag inappropriate content)
  createCommunityReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const { targetType, targetId, reason, details } = validators.validateCommunityReport(req.body);

      const newReport: CommunityReportTable = {
        reportId: "rep_flag_" + Math.random().toString(36).substring(2, 10),
        reporterId: user.id,
        reporterName: user.name,
        targetType,
        targetId,
        reason,
        details,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      const saved = db.createCommunityReport(newReport);

      auditService.log({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "COMMUNITY_REPORTED",
        targetType,
        targetId,
        metadata: { reason },
        ipAddress: req.ip
      });

      return res.status(201).json({
        success: true,
        message: "Report submitted to Trust & Safety moderation queue.",
        report: saved
      });
    } catch (err) {
      next(err);
    }
  }
};
