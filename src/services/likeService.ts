import { CommunityLike } from "../types";
import { postService } from "./postService";

const STORAGE_KEY = "sentimentai_community_likes_v1";

const INITIAL_LIKES: CommunityLike[] = [
  {
    likeId: "like_sample_01",
    postId: "post_sample_01",
    userId: "usr_marcus_dev",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    likeId: "like_sample_02",
    postId: "post_sample_02",
    userId: "usr_elena_ai",
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
  }
];

export const likeService = {
  // Check if a user has liked a specific post
  hasUserLiked: (postId: string, userId: string): boolean => {
    if (!userId || !postId) return false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const likes: CommunityLike[] = stored ? JSON.parse(stored) : INITIAL_LIKES;
      return likes.some(l => l.postId === postId && l.userId === userId);
    } catch {
      return false;
    }
  },

  // Get all post IDs liked by a user
  getUserLikedPostIds: (userId: string): string[] => {
    if (!userId) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const likes: CommunityLike[] = stored ? JSON.parse(stored) : INITIAL_LIKES;
      return likes.filter(l => l.userId === userId).map(l => l.postId);
    } catch {
      return [];
    }
  },

  // Like a post (prevent duplicate likes)
  likePost: async (postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> => {
    if (!userId || !postId) throw new Error("Post ID and User ID are required.");

    const stored = localStorage.getItem(STORAGE_KEY);
    const likes: CommunityLike[] = stored ? JSON.parse(stored) : INITIAL_LIKES;

    const existing = likes.find(l => l.postId === postId && l.userId === userId);
    if (existing) {
      // Already liked, do not duplicate
      const post = await postService.getPostById(postId);
      return { liked: true, likeCount: post?.likeCount || 0 };
    }

    const newLike: CommunityLike = {
      likeId: `like_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      postId,
      userId,
      createdAt: new Date().toISOString()
    };

    likes.push(newLike);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));

    const newCount = await postService.updateLikeCount(postId, 1);
    return { liked: true, likeCount: newCount };
  },

  // Unlike a post
  unlikePost: async (postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> => {
    if (!userId || !postId) throw new Error("Post ID and User ID are required.");

    const stored = localStorage.getItem(STORAGE_KEY);
    const likes: CommunityLike[] = stored ? JSON.parse(stored) : INITIAL_LIKES;

    const existingIndex = likes.findIndex(l => l.postId === postId && l.userId === userId);
    if (existingIndex === -1) {
      // Not liked
      const post = await postService.getPostById(postId);
      return { liked: false, likeCount: post?.likeCount || 0 };
    }

    likes.splice(existingIndex, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));

    const newCount = await postService.updateLikeCount(postId, -1);
    return { liked: false, likeCount: newCount };
  },

  // Toggle like/unlike
  toggleLike: async (postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> => {
    if (likeService.hasUserLiked(postId, userId)) {
      return await likeService.unlikePost(postId, userId);
    } else {
      return await likeService.likePost(postId, userId);
    }
  }
};
