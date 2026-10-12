import {
  CommunityPost,
  CommunityVisibility,
  CommunitySharedAnalysis,
  CommunityFeedFilter,
  CommunityFileAttachment,
  PostStatus
} from "../types";
import { historyService } from "./historyService";
import { dbStorage } from "./dbStorage";

const STORAGE_KEY = "sentimentai_community_posts_v1";
export const COMMUNITY_UPDATED_EVENT = "sentimentai_community_posts_updated";

// In-memory runtime cache for lightning-fast synchronous queries
let cachedPosts: CommunityPost[] | null = null;
let isIndexedDBInitialized = false;

/**
 * Robust HTML sanitizer to prevent XSS injection
 */
export function sanitizeContent(text: string): string {
  if (!text) return "";
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .trim();
}

function notifyFeedUpdated(post?: CommunityPost) {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(COMMUNITY_UPDATED_EVENT, { detail: { post } }));
    }
  } catch {}
}

/**
 * Creates a lightweight version of posts for localStorage to prevent quota overflow
 */
function createCompactPosts(posts: CommunityPost[]): CommunityPost[] {
  return posts.slice(0, 50).map(p => {
    if (p.fileAttachment && p.fileAttachment.dataUrl && p.fileAttachment.dataUrl.length > 50000) {
      return {
        ...p,
        fileAttachment: {
          ...p.fileAttachment,
          // Truncate dataUrl in localStorage cache since full dataUrl is stored in IndexedDB and memory
          dataUrl: ""
        }
      };
    }
    return p;
  });
}

function getRawStoredPosts(): CommunityPost[] {
  if (cachedPosts && cachedPosts.length > 0) {
    return cachedPosts;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedPosts = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Error reading localStorage community posts:", e);
  }

  cachedPosts = INITIAL_POSTS;
  return INITIAL_POSTS;
}

function saveStoredPosts(posts: CommunityPost[]) {
  // 1. Immediately update in-memory cache
  cachedPosts = posts;

  // 2. Persist full posts (with complete media / dataUrls) into high-capacity IndexedDB
  dbStorage.savePosts(posts).catch(err => {
    console.warn("Could not write posts to IndexedDB:", err);
  });

  // 3. Persist compact metadata into localStorage without heavy dataUrls to prevent quota errors
  try {
    const compact = createCompactPosts(posts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
  } catch (e: any) {
    try {
      // Minimal fallback: top 15 posts without attachments
      const minimal = posts.slice(0, 15).map(p => ({
        ...p,
        fileAttachment: undefined
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    } catch {
      // In-memory + IndexedDB will continue to serve without interrupting the user
    }
  }
}

// Background initial load from IndexedDB on startup
if (typeof window !== "undefined") {
  dbStorage.loadPosts().then(dbPosts => {
    if (dbPosts && dbPosts.length > 0) {
      cachedPosts = dbPosts;
      isIndexedDBInitialized = true;
    }
  }).catch(() => {});
}

// Initial sample seed posts demonstrating community analysis sharing
const INITIAL_POSTS: CommunityPost[] = [
  {
    postId: "post_sample_01",
    userId: "usr_elena_ai",
    userName: "Dr. Elena Rostova",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    title: "Breakthrough Multimodal Tone Shift in Hybrid Executive Meetings",
    content: "We conducted a comprehensive sentiment analysis across 45 minutes of executive team negotiations. Even when verbal language remained professionally neutral, micro-expression facial recognition flagged subtle hesitation and anxiety before key budget alignments.",
    analysisId: "shared_sample_an_01",
    sharedAnalysis: {
      analysisId: "shared_sample_an_01",
      title: "Executive Negotiation Tone Analysis",
      sentiment: "Mixed",
      dominantEmotion: "Hesitation & Analytical",
      confidence: 94,
      inputType: "mixed",
      meaningSummary: "Dialogue demonstrates constructive resolution despite initial hesitance surrounding quarterly budget allocation."
    },
    visibility: "public",
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    likeCount: 28,
    commentCount: 6,
    status: "published"
  },
  {
    postId: "post_sample_02",
    userId: "usr_marcus_dev",
    userName: "Marcus Vance",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    title: "How SentimentAI accurately captured customer relief after v2 release",
    content: "Customer satisfaction feedback logs from our latest release were evaluated through the SentimentAI pipeline. The emotional trajectory went from acute frustration to profound relief and excitement once the automated patch was deployed.",
    analysisId: "shared_sample_an_02",
    sharedAnalysis: {
      analysisId: "shared_sample_an_02",
      title: "v2.4 Release User Feedback Cluster",
      sentiment: "Positive",
      dominantEmotion: "Relief & Excitement",
      confidence: 98,
      inputType: "text",
      meaningSummary: "92% of sampled customer statements highlight swift bug resolution and simplified workflow appreciation."
    },
    visibility: "community",
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    likeCount: 42,
    commentCount: 9,
    status: "published"
  },
  {
    postId: "post_sample_03",
    userId: "usr_aisha_ux",
    userName: "Aisha Patel",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    title: "Best practices for multi-speaker vocal inflection tracking",
    content: "When testing multi-speaker video feeds, background ambient noise can occasionally suppress secondary voices. Normalizing audio channels prior to AI inference dramatically improves confidence intervals from 72% to over 95%. Has anyone else observed this in noisy recording environments?",
    visibility: "community",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    likeCount: 19,
    commentCount: 4,
    status: "published"
  }
];

export const postService = {
  // Retrieve publicly/community visible published posts (plus user's own drafts if specified)
  getPosts: async (options?: { currentUserId?: string; includeDrafts?: boolean }): Promise<CommunityPost[]> => {
    try {
      if (!isIndexedDBInitialized) {
        const dbPosts = await dbStorage.loadPosts();
        if (dbPosts && dbPosts.length > 0) {
          cachedPosts = dbPosts;
          isIndexedDBInitialized = true;
        }
      }

      const allPosts = getRawStoredPosts();
      return allPosts.filter(p => {
        // Always show published public/community posts
        if (p.status === "published" && (p.visibility === "community" || p.visibility === "public")) {
          return true;
        }
        // If includeDrafts or currentUserId matches, allow the owner to see their own draft posts
        if (options?.includeDrafts && options?.currentUserId && p.userId === options.currentUserId) {
          return true;
        }
        return false;
      });
    } catch (e) {
      console.error("Error reading community posts:", e);
      return INITIAL_POSTS;
    }
  },

  // Get a single post by unique ID
  getPostById: async (postId: string): Promise<CommunityPost | null> => {
    const allPosts = getRawStoredPosts();
    const post = allPosts.find(p => p.postId === postId);
    return post || null;
  },

  // Create a new community post with explicit status ("published" or "draft")
  createPost: async (data: {
    userId: string;
    userName: string;
    userAvatar?: string;
    title: string;
    content: string;
    fileAttachment?: CommunityFileAttachment;
    analysisId?: string;
    sharedAnalysis?: CommunitySharedAnalysis;
    visibility: CommunityVisibility;
    status?: PostStatus;
  }): Promise<CommunityPost> => {
    const title = sanitizeContent(data.title);
    const content = sanitizeContent(data.content);

    if (!title) throw new Error("Post title is required.");
    if (title.length > 180) throw new Error("Post title cannot exceed 180 characters.");
    if (!content) throw new Error("Post content is required.");
    if (content.length > 3500) throw new Error("Post content cannot exceed 3,500 characters.");

    if (data.visibility === "private") {
      throw new Error("Cannot publish a post with 'Private' visibility. Please select 'Community Only' or 'Public'.");
    }

    let sharedAnalysis: CommunitySharedAnalysis | undefined = data.sharedAnalysis;

    // If analysisId is attached and sharedAnalysis not pre-provided, extract summary
    if (data.analysisId && !sharedAnalysis) {
      const analysisRecord = await historyService.getAnalysisById(data.analysisId);
      if (analysisRecord) {
        sharedAnalysis = {
          analysisId: analysisRecord.analysisId,
          title: analysisRecord.title || "Multimodal Analysis",
          sentiment: (analysisRecord.overallSentiment?.label as any) || "Neutral",
          dominantEmotion: analysisRecord.dominantEmotion || "Neutral",
          confidence: analysisRecord.overallSentiment?.score ? Math.round(analysisRecord.overallSentiment.score * 100) : 90,
          inputType: analysisRecord.inputTypes?.[0] || "text",
          meaningSummary: analysisRecord.summary?.slice(0, 200) || "Sentiment discovery record"
        };
      }
    }

    const postStatus: PostStatus = data.status || "published";
    const nowIso = new Date().toISOString();

    const newPost: CommunityPost = {
      postId: `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      title,
      content,
      fileAttachment: data.fileAttachment,
      analysisId: data.analysisId,
      sharedAnalysis,
      visibility: data.visibility,
      createdAt: nowIso,
      updatedAt: nowIso,
      publishedAt: postStatus === "published" ? nowIso : undefined,
      likeCount: 0,
      commentCount: 0,
      status: postStatus
    };

    const allPosts = getRawStoredPosts();
    const updated = [newPost, ...allPosts];
    saveStoredPosts(updated);
    notifyFeedUpdated(newPost);

    return newPost;
  },

  // Edit an existing post (User can edit only their own posts)
  updatePost: async (
    postId: string,
    userId: string,
    data: {
      title: string;
      content: string;
      visibility?: CommunityVisibility;
      fileAttachment?: CommunityFileAttachment;
      status?: PostStatus;
    }
  ): Promise<CommunityPost> => {
    const allPosts = getRawStoredPosts();
    const index = allPosts.findIndex(p => p.postId === postId);
    if (index === -1) throw new Error("Post not found.");

    const post = allPosts[index];
    if (post.userId !== userId) {
      throw new Error("Unauthorized: You can only edit your own posts.");
    }

    const title = sanitizeContent(data.title);
    const content = sanitizeContent(data.content);
    if (!title) throw new Error("Title cannot be empty.");
    if (!content) throw new Error("Content cannot be empty.");

    const nowIso = new Date().toISOString();
    const newStatus: PostStatus = data.status !== undefined ? data.status : post.status;
    const isNowPublished = newStatus === "published";

    const updatedPost: CommunityPost = {
      ...post,
      title,
      content,
      fileAttachment: data.fileAttachment !== undefined ? data.fileAttachment : post.fileAttachment,
      visibility: (data.visibility && data.visibility !== "private") ? data.visibility : post.visibility,
      status: newStatus,
      publishedAt: isNowPublished ? (post.publishedAt || nowIso) : undefined,
      updatedAt: nowIso
    };

    allPosts[index] = updatedPost;
    saveStoredPosts(allPosts);
    notifyFeedUpdated(updatedPost);
    return updatedPost;
  },

  // Publish a post directly (sets status to 'published' and updates timestamp in real-time)
  publishPost: async (postId: string, userId: string): Promise<CommunityPost> => {
    const allPosts = getRawStoredPosts();
    const index = allPosts.findIndex(p => p.postId === postId);
    if (index === -1) throw new Error("Post not found.");

    const post = allPosts[index];
    if (post.userId !== userId) {
      throw new Error("Unauthorized: You can only publish your own posts.");
    }

    const nowIso = new Date().toISOString();
    const updatedPost: CommunityPost = {
      ...post,
      status: "published",
      publishedAt: nowIso,
      updatedAt: nowIso
    };

    allPosts[index] = updatedPost;
    saveStoredPosts(allPosts);
    notifyFeedUpdated(updatedPost);
    return updatedPost;
  },

  // Unpublish a post directly (sets status to 'draft')
  unpublishPost: async (postId: string, userId: string): Promise<CommunityPost> => {
    const allPosts = getRawStoredPosts();
    const index = allPosts.findIndex(p => p.postId === postId);
    if (index === -1) throw new Error("Post not found.");

    const post = allPosts[index];
    if (post.userId !== userId) {
      throw new Error("Unauthorized: You can only unpublish your own posts.");
    }

    const nowIso = new Date().toISOString();
    const updatedPost: CommunityPost = {
      ...post,
      status: "draft",
      updatedAt: nowIso
    };

    allPosts[index] = updatedPost;
    saveStoredPosts(allPosts);
    notifyFeedUpdated(updatedPost);
    return updatedPost;
  },

  // Toggle or update post status
  updatePostStatus: async (postId: string, userId: string, status: PostStatus): Promise<CommunityPost> => {
    if (status === "published") {
      return postService.publishPost(postId, userId);
    } else {
      return postService.unpublishPost(postId, userId);
    }
  },

  // Delete an existing post (User can delete only their own posts or admin)
  deletePost: async (postId: string, userId: string, isAdmin = false): Promise<boolean> => {
    const allPosts = getRawStoredPosts();
    const post = allPosts.find(p => p.postId === postId);
    if (!post) return false;

    if (post.userId !== userId && !isAdmin) {
      throw new Error("Unauthorized: You can only delete your own posts.");
    }

    const updated = allPosts.filter(p => p.postId !== postId);
    saveStoredPosts(updated);
    notifyFeedUpdated();
    return true;
  },

  // Update like count in post
  updateLikeCount: async (postId: string, delta: number): Promise<number> => {
    const allPosts = getRawStoredPosts();
    const index = allPosts.findIndex(p => p.postId === postId);
    if (index === -1) return 0;

    const newCount = Math.max(0, (allPosts[index].likeCount || 0) + delta);
    allPosts[index].likeCount = newCount;
    saveStoredPosts(allPosts);
    notifyFeedUpdated(allPosts[index]);
    return newCount;
  },

  // Update comment count in post
  updateCommentCount: async (postId: string, delta: number): Promise<number> => {
    const allPosts = getRawStoredPosts();
    const index = allPosts.findIndex(p => p.postId === postId);
    if (index === -1) return 0;

    const newCount = Math.max(0, (allPosts[index].commentCount || 0) + delta);
    allPosts[index].commentCount = newCount;
    saveStoredPosts(allPosts);
    notifyFeedUpdated(allPosts[index]);
    return newCount;
  },

  // Search posts by title, content, user name, sentiment, emotion, status
  searchPosts: (query: string, posts: CommunityPost[]): CommunityPost[] => {
    if (!query || !query.trim()) return posts;
    const q = query.trim().toLowerCase();

    return posts.filter(post => {
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchContent = post.content.toLowerCase().includes(q);
      const matchUser = (post.userName || "").toLowerCase().includes(q);
      const matchSentiment = (post.sharedAnalysis?.sentiment || "").toLowerCase().includes(q);
      const matchEmotion = (post.sharedAnalysis?.dominantEmotion || "").toLowerCase().includes(q);
      const matchFileName = (post.fileAttachment?.name || "").toLowerCase().includes(q);
      const matchStatus = (post.status || "").toLowerCase().includes(q);
      return matchTitle || matchContent || matchUser || matchSentiment || matchEmotion || matchFileName || matchStatus;
    });
  },

  // Filter posts by active criteria
  filterPosts: (filter: CommunityFeedFilter, posts: CommunityPost[]): CommunityPost[] => {
    const cloned = [...posts];
    switch (filter) {
      case "recent":
        return cloned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "popular":
        return cloned.sort((a, b) => (b.likeCount + b.commentCount * 2) - (a.likeCount + a.commentCount * 2));
      case "analyses":
        return cloned.filter(p => !!p.sharedAnalysis || !!p.analysisId);
      case "files":
        return cloned.filter(p => !!p.fileAttachment);
      case "discussions":
        return cloned.filter(p => !p.sharedAnalysis && !p.analysisId && !p.fileAttachment);
      default:
        return cloned;
    }
  }
};
