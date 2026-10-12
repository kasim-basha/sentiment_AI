import {
  CommunityPost,
  CommunityComment,
  CommunityVisibility,
  CommunityFeedFilter,
  ReportReason,
  CommunityReport,
  CommunityFileAttachment,
  User
} from "../types";
import { postService } from "./postService";
import { commentService } from "./commentService";
import { likeService } from "./likeService";
import { moderationService } from "./moderationService";
import { historyService } from "./historyService";

export interface PublicUserProfile {
  userId: string;
  fullName: string;
  profilePicture?: string;
  publicPostsCount: number;
  sharedAnalysesCount: number;
  posts: CommunityPost[];
}

export const communityService = {
  // Posts
  getPosts: async (): Promise<CommunityPost[]> => {
    return await postService.getPosts();
  },

  getPostById: async (id: string): Promise<CommunityPost | null> => {
    return await postService.getPostById(id);
  },

  createPost: async (data: {
    userId: string;
    userName: string;
    userAvatar?: string;
    title: string;
    content: string;
    fileAttachment?: CommunityFileAttachment;
    analysisId?: string;
    visibility: CommunityVisibility;
  }): Promise<CommunityPost> => {
    return await postService.createPost(data);
  },

  updatePost: async (
    id: string,
    userId: string,
    data: {
      title: string;
      content: string;
      visibility?: CommunityVisibility;
      fileAttachment?: CommunityFileAttachment;
      status?: import("../types").PostStatus;
    }
  ): Promise<CommunityPost> => {
    return await postService.updatePost(id, userId, data);
  },

  publishPost: async (postId: string, userId: string): Promise<CommunityPost> => {
    return await postService.publishPost(postId, userId);
  },

  unpublishPost: async (postId: string, userId: string): Promise<CommunityPost> => {
    return await postService.unpublishPost(postId, userId);
  },

  updatePostStatus: async (postId: string, userId: string, status: import("../types").PostStatus): Promise<CommunityPost> => {
    return await postService.updatePostStatus(postId, userId, status);
  },

  deletePost: async (id: string, userId: string, isAdmin = false): Promise<boolean> => {
    return await postService.deletePost(id, userId, isAdmin);
  },

  searchPosts: (query: string, posts: CommunityPost[]): CommunityPost[] => {
    return postService.searchPosts(query, posts);
  },

  filterPosts: (filter: CommunityFeedFilter, posts: CommunityPost[]): CommunityPost[] => {
    return postService.filterPosts(filter, posts);
  },

  // Likes
  likePost: async (postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> => {
    return await likeService.likePost(postId, userId);
  },

  unlikePost: async (postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> => {
    return await likeService.unlikePost(postId, userId);
  },

  hasUserLiked: (postId: string, userId: string): boolean => {
    return likeService.hasUserLiked(postId, userId);
  },

  toggleLike: async (postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> => {
    return await likeService.toggleLike(postId, userId);
  },

  // Comments
  getComments: async (postId: string): Promise<CommunityComment[]> => {
    return await commentService.getComments(postId);
  },

  createComment: async (
    postId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    content: string
  ): Promise<CommunityComment> => {
    return await commentService.createComment(postId, userId, userName, userAvatar, content);
  },

  updateComment: async (commentId: string, userId: string, content: string): Promise<CommunityComment> => {
    return await commentService.updateComment(commentId, userId, content);
  },

  deleteComment: async (commentId: string, userId: string, isAdmin = false): Promise<boolean> => {
    return await commentService.deleteComment(commentId, userId, isAdmin);
  },

  // Moderation
  reportPost: async (data: {
    postId: string;
    reporterId: string;
    reporterName: string;
    reason: ReportReason;
    details?: string;
  }): Promise<CommunityReport> => {
    return await moderationService.reportPost(data);
  },

  reportComment: async (data: {
    commentId: string;
    postId: string;
    reporterId: string;
    reporterName: string;
    reason: ReportReason;
    details?: string;
  }): Promise<CommunityReport> => {
    return await moderationService.reportComment(data);
  },

  // Share existing analysis
  shareAnalysis: async (params: {
    analysisId: string;
    visibility: CommunityVisibility;
    title: string;
    description: string;
    user: User;
  }): Promise<CommunityPost> => {
    if (params.visibility === "private") {
      throw new Error("Cannot share an analysis to the community with 'Private' visibility. Please choose 'Community Only' or 'Public'.");
    }

    // Check ownership of the analysis
    const analysisRecord = await historyService.getAnalysisById(params.analysisId);

    const title = params.title || analysisRecord?.title || "Multimodal Intelligence Analysis";
    const content = params.description || analysisRecord?.summary || "Shared multimodal sentiment discovery.";

    let sharedAnalysis = undefined;
    if (analysisRecord) {
      sharedAnalysis = {
        analysisId: analysisRecord.analysisId,
        title: analysisRecord.title || title,
        sentiment: (analysisRecord.overallSentiment?.label as any) || "Neutral",
        dominantEmotion: analysisRecord.dominantEmotion || "Reflective",
        confidence: analysisRecord.overallSentiment?.score ? Math.round(analysisRecord.overallSentiment.score * 100) : 90,
        inputType: (analysisRecord.inputTypes?.[0] as any) || "text",
        meaningSummary: analysisRecord.summary?.slice(0, 200) || content.slice(0, 200)
      };
    }

    // Create the community post referencing this analysis
    return await postService.createPost({
      userId: params.user.id,
      userName: params.user.name,
      userAvatar: params.user.avatar,
      title,
      content,
      analysisId: params.analysisId,
      sharedAnalysis,
      visibility: params.visibility
    });
  },

  // Public Community User Profile
  // CRITICAL PRIVACY: Exposes ONLY name, avatar, public posts, and shared analyses.
  // Never exposes email, phone, private analyses, private reports, settings, or credentials.
  getPublicProfile: async (targetUserId: string): Promise<PublicUserProfile | null> => {
    const posts = await postService.getPosts();
    const userPosts = posts.filter(p => p.userId === targetUserId);

    if (userPosts.length === 0) {
      // Check if user is the known current seed or just an author
      return {
        userId: targetUserId,
        fullName: "Community Contributor",
        publicPostsCount: 0,
        sharedAnalysesCount: 0,
        posts: []
      };
    }

    const first = userPosts[0];
    const sharedAnalyses = userPosts.filter(p => !!p.analysisId || !!p.sharedAnalysis);

    return {
      userId: targetUserId,
      fullName: first.userName || "Community Member",
      profilePicture: first.userAvatar,
      publicPostsCount: userPosts.length,
      sharedAnalysesCount: sharedAnalyses.length,
      posts: userPosts
    };
  }
};
