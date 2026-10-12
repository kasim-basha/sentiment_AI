import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CommunityPost,
  CommunityFeedFilter,
  User,
  CommunityVisibility,
  CommunityFileAttachment
} from "../../types";
import { communityService } from "../../services/communityService";
import { likeService } from "../../services/likeService";
import { COMMUNITY_UPDATED_EVENT } from "../../services/postService";
import { CommunityHeader } from "./CommunityHeader";
import { CommunitySearch } from "./CommunitySearch";
import { CommunityFilters } from "./CommunityFilters";
import { CommunityPostCard } from "./CommunityPostCard";
import { PostComposer } from "./PostComposer";
import { ReportContentDialog } from "./ReportContentDialog";
import { PublicCommunityProfile } from "./PublicCommunityProfile";
import { CommunitySkeleton } from "./CommunitySkeleton";
import { CommunityEmptyState, CommunityNoResults, CommunityErrorState } from "./CommunityEmptyState";
import { CheckCircle2 } from "lucide-react";

interface CommunityPageProps {
  currentUser: User;
  onNavigateToDashboard: () => void;
  onViewAnalysis?: (analysisId: string) => void;
}

export function CommunityPage({
  currentUser,
  onNavigateToDashboard,
  onViewAnalysis
}: CommunityPageProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState<CommunityFeedFilter>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Likes tracking
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  // Composer state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

  // Reporting dialog state
  const [reportDialog, setReportDialog] = useState<{
    isOpen: boolean;
    targetType: "post" | "comment";
    targetId: string;
    postId?: string;
  }>({
    isOpen: false,
    targetType: "post",
    targetId: ""
  });

  // Public Community Profile viewer
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  // Load posts and user likes
  const loadCommunityData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setHasError(false);
    try {
      // Include user's own drafts so they can see and publish them
      const data = await communityService.getPosts();
      setPosts(data);
      const userLikes = likeService.getUserLikedPostIds(currentUser.id);
      setLikedPostIds(new Set(userLikes));
    } catch (err) {
      console.error("Failed to load community feed:", err);
      if (!silent) setHasError(true);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  // Live listener for real-time post creation and updates
  useEffect(() => {
    const handleFeedUpdated = () => {
      loadCommunityData(true);
    };

    window.addEventListener(COMMUNITY_UPDATED_EVENT, handleFeedUpdated);
    window.addEventListener("storage", handleFeedUpdated);
    return () => {
      window.removeEventListener(COMMUNITY_UPDATED_EVENT, handleFeedUpdated);
      window.removeEventListener("storage", handleFeedUpdated);
    };
  }, [loadCommunityData]);

  // Handle Likes
  const handleLikeToggle = async (postId: string) => {
    try {
      const result = await communityService.toggleLike(postId, currentUser.id);
      setLikedPostIds(prev => {
        const next = new Set(prev);
        if (result.liked) next.add(postId);
        else next.delete(postId);
        return next;
      });

      // Update local post like count
      setPosts(prev => prev.map(p => {
        if (p.postId === postId) {
          return { ...p, likeCount: result.likeCount };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  // Handle Post Creation / Update
  const handleComposerSubmit = async (data: {
    title: string;
    content: string;
    fileAttachment?: CommunityFileAttachment;
    analysisId?: string;
    visibility: CommunityVisibility;
  }) => {
    if (editingPost) {
      const updated = await communityService.updatePost(editingPost.postId, currentUser.id, {
        title: data.title,
        content: data.content,
        fileAttachment: data.fileAttachment,
        visibility: data.visibility
      });
      setPosts(prev => prev.map(p => p.postId === updated.postId ? updated : p));
      setEditingPost(null);
      setSuccessToast("Community post updated successfully!");
    } else {
      const created = await communityService.createPost({
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        title: data.title,
        content: data.content,
        fileAttachment: data.fileAttachment,
        analysisId: data.analysisId,
        visibility: data.visibility
      });
      setPosts(prev => [created, ...prev]);
      setSuccessToast("Post published to community feed successfully!");
    }

    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Handle Post Deletion
  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      await communityService.deletePost(postId, currentUser.id, currentUser.role === "admin");
      setPosts(prev => prev.filter(p => p.postId !== postId));
      setSuccessToast("Post deleted.");
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Handle Real-Time Publishing & Status Toggle
  const handleTogglePublish = async (postId: string) => {
    try {
      const target = posts.find(p => p.postId === postId);
      if (!target) return;

      if (target.status === "draft") {
        const published = await communityService.publishPost(postId, currentUser.id);
        setPosts(prev => prev.map(p => p.postId === postId ? published : p));
        setSuccessToast("Post published to community feed in real-time!");
      } else {
        const unpublished = await communityService.unpublishPost(postId, currentUser.id);
        setPosts(prev => prev.map(p => p.postId === postId ? unpublished : p));
        setSuccessToast("Post moved to drafts.");
      }

      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error("Failed to toggle publish status:", err);
      alert(err.message || "Failed to update publish status.");
    }
  };

  // Filtered & Searched posts
  const filteredPosts = useMemo(() => {
    // 1. Filter by category
    const byCategory = communityService.filterPosts(filter, posts);
    // 2. Filter by search
    return communityService.searchPosts(searchQuery, byCategory);
  }, [posts, filter, searchQuery]);

  // If viewing a public user profile
  if (profileUserId) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PublicCommunityProfile
          userId={profileUserId}
          currentUser={currentUser}
          onBackToFeed={() => setProfileUserId(null)}
          onLikeToggle={handleLikeToggle}
          likedPostIds={likedPostIds}
          onEditPost={(p) => {
            setEditingPost(p);
            setIsComposerOpen(true);
          }}
          onDeletePost={handleDeletePost}
          onTogglePublish={handleTogglePublish}
          onReportPost={(postId) => setReportDialog({ isOpen: true, targetType: "post", targetId: postId })}
          onReportComment={(commentId, postId) => setReportDialog({ isOpen: true, targetType: "comment", targetId: commentId, postId })}
          onViewAnalysis={onViewAnalysis}
        />

        {/* Reporting Modal */}
        <ReportContentDialog
          isOpen={reportDialog.isOpen}
          onClose={() => setReportDialog({ isOpen: false, targetType: "post", targetId: "" })}
          targetType={reportDialog.targetType}
          targetId={reportDialog.targetId}
          postId={reportDialog.postId}
          currentUser={currentUser}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Toast Notification */}
      {successToast && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <CommunityHeader
        onCreatePostClick={() => {
          setEditingPost(null);
          setIsComposerOpen(true);
        }}
      />

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <CommunitySearch
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />
        <CommunityFilters
          activeFilter={filter}
          onFilterChange={setFilter}
        />
      </div>

      {/* Main Content Feed */}
      {isLoading ? (
        <CommunitySkeleton />
      ) : hasError ? (
        <CommunityErrorState
          onRetry={loadCommunityData}
          onBackToDashboard={onNavigateToDashboard}
        />
      ) : posts.length === 0 ? (
        <CommunityEmptyState
          onCreatePostClick={() => {
            setEditingPost(null);
            setIsComposerOpen(true);
          }}
        />
      ) : filteredPosts.length === 0 ? (
        <CommunityNoResults
          onClearFilters={() => {
            setSearchQuery("");
            setFilter("recent");
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <CommunityPostCard
              key={post.postId}
              post={post}
              currentUser={currentUser}
              onLikeToggle={handleLikeToggle}
              isLiked={likedPostIds.has(post.postId)}
              onEditPost={(p) => {
                setEditingPost(p);
                setIsComposerOpen(true);
              }}
              onDeletePost={handleDeletePost}
              onTogglePublish={handleTogglePublish}
              onReportPost={(postId) => setReportDialog({ isOpen: true, targetType: "post", targetId: postId })}
              onReportComment={(commentId, pId) => setReportDialog({ isOpen: true, targetType: "comment", targetId: commentId, postId: pId })}
              onViewProfile={(userId) => setProfileUserId(userId)}
              onViewAnalysis={onViewAnalysis}
            />
          ))}
        </div>
      )}

      {/* Post Composer Modal */}
      <PostComposer
        isOpen={isComposerOpen}
        onClose={() => {
          setIsComposerOpen(false);
          setEditingPost(null);
        }}
        onSubmit={handleComposerSubmit}
        currentUser={currentUser}
        editPost={editingPost}
      />

      {/* Report Modal */}
      <ReportContentDialog
        isOpen={reportDialog.isOpen}
        onClose={() => setReportDialog({ isOpen: false, targetType: "post", targetId: "" })}
        targetType={reportDialog.targetType}
        targetId={reportDialog.targetId}
        postId={reportDialog.postId}
        currentUser={currentUser}
      />
    </div>
  );
}
