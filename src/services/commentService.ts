import { CommunityComment } from "../types";
import { postService, sanitizeContent } from "./postService";

const STORAGE_KEY = "sentimentai_community_comments_v1";

const INITIAL_COMMENTS: CommunityComment[] = [
  {
    commentId: "comment_sample_01",
    postId: "post_sample_01",
    userId: "usr_marcus_dev",
    userName: "Marcus Vance",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    content: "Fascinating analysis! Did you notice if the vocal pitch varied in correlation with the micro-expressions?",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    commentId: "comment_sample_02",
    postId: "post_sample_01",
    userId: "usr_elena_ai",
    userName: "Dr. Elena Rostova",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    content: "Yes, exactly! Vocal pitch momentarily tightened by approximately 18Hz during the second contract clause review.",
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString()
  },
  {
    commentId: "comment_sample_03",
    postId: "post_sample_02",
    userId: "usr_aisha_ux",
    userName: "Aisha Patel",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    content: "Quantifying customer relief with AI confidence scores is game-changing for quarterly product reporting.",
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString()
  }
];

export const commentService = {
  // Retrieve all comments for a post
  getComments: async (postId: string): Promise<CommunityComment[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let comments: CommunityComment[] = [];
      if (!stored) {
        comments = INITIAL_COMMENTS;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMMENTS));
      } else {
        comments = JSON.parse(stored);
      }
      return comments
        .filter(c => c.postId === postId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (e) {
      console.error("Error reading comments:", e);
      return [];
    }
  },

  // Create a new comment
  createComment: async (
    postId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    content: string
  ): Promise<CommunityComment> => {
    const cleaned = sanitizeContent(content);
    if (!cleaned) throw new Error("Comment cannot be empty.");
    if (cleaned.length > 1000) throw new Error("Comment cannot exceed 1,000 characters.");

    const newComment: CommunityComment = {
      commentId: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      postId,
      userId,
      userName,
      userAvatar,
      content: cleaned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const comments: CommunityComment[] = stored ? JSON.parse(stored) : INITIAL_COMMENTS;
    comments.push(newComment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));

    // Update comment counter in post
    await postService.updateCommentCount(postId, 1);

    return newComment;
  },

  // Edit an existing comment (User can edit only their own comments)
  updateComment: async (commentId: string, userId: string, content: string): Promise<CommunityComment> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) throw new Error("Comment not found.");
    const comments: CommunityComment[] = JSON.parse(stored);
    const index = comments.findIndex(c => c.commentId === commentId);
    if (index === -1) throw new Error("Comment not found.");

    const comment = comments[index];
    if (comment.userId !== userId) {
      throw new Error("Unauthorized: You can only edit your own comment.");
    }

    const cleaned = sanitizeContent(content);
    if (!cleaned) throw new Error("Comment cannot be empty.");
    if (cleaned.length > 1000) throw new Error("Comment cannot exceed 1,000 characters.");

    comments[index] = {
      ...comment,
      content: cleaned,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    return comments[index];
  },

  // Delete a comment (User can delete only their own comments, or admin)
  deleteComment: async (commentId: string, userId: string, isAdmin = false): Promise<boolean> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const comments: CommunityComment[] = JSON.parse(stored);
    const comment = comments.find(c => c.commentId === commentId);
    if (!comment) return false;

    if (comment.userId !== userId && !isAdmin) {
      throw new Error("Unauthorized: You can only delete your own comment.");
    }

    const updated = comments.filter(c => c.commentId !== commentId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Decrement post comment counter
    await postService.updateCommentCount(comment.postId, -1);
    return true;
  }
};
