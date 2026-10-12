import React, { useState, useEffect } from "react";
import { ArrowLeft, Brain, MessageSquare, ShieldCheck, UserCheck } from "lucide-react";
import { CommunityPost, User } from "../../types";
import { communityService, PublicUserProfile } from "../../services/communityService";
import { CommunityPostCard } from "./CommunityPostCard";
import { CommunitySkeleton } from "./CommunitySkeleton";

interface PublicCommunityProfileProps {
  userId: string;
  currentUser: User;
  onBackToFeed: () => void;
  onLikeToggle: (postId: string) => Promise<void>;
  likedPostIds: Set<string>;
  onEditPost?: (post: CommunityPost) => void;
  onDeletePost?: (postId: string) => void;
  onTogglePublish?: (postId: string) => Promise<void>;
  onReportPost: (postId: string) => void;
  onReportComment: (commentId: string, postId: string) => void;
  onViewAnalysis?: (analysisId: string) => void;
}

export function PublicCommunityProfile({
  userId,
  currentUser,
  onBackToFeed,
  onLikeToggle,
  likedPostIds,
  onEditPost,
  onDeletePost,
  onTogglePublish,
  onReportPost,
  onReportComment,
  onViewAnalysis
}: PublicCommunityProfileProps) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "analyses">("posts");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const data = await communityService.getPublicProfile(userId);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to load public profile:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={onBackToFeed}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community Feed</span>
        </button>
        <CommunitySkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-2">Member Profile Not Found</h3>
        <p className="text-xs text-slate-400 mb-4">
          This community profile may have been removed or contains no public contributions.
        </p>
        <button
          type="button"
          onClick={onBackToFeed}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Back to Community Feed
        </button>
      </div>
    );
  }

  const postsToDisplay = activeTab === "posts"
    ? profile.posts
    : profile.posts.filter(p => !!p.sharedAnalysis || !!p.analysisId);

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <button
        type="button"
        onClick={onBackToFeed}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>← Back to Community Feed</span>
      </button>

      {/* Public Profile Header Card */}
      {/* STRICT PRIVACY RULE: Exposes ONLY Name, Avatar, Public posts, and Shared analyses. NO emails, phones, or private reports. */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.fullName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/50 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-extrabold ring-2 ring-blue-500/50 shadow-lg">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {profile.fullName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Community Member
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Verified Public Contributor • Privacy Enforced</span>
              </p>
            </div>
          </div>

          {/* Public Contribution Stats */}
          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
            <div className="text-center sm:text-left">
              <span className="text-xs uppercase font-bold text-slate-500 block">Public Posts</span>
              <span className="text-xl font-extrabold text-white">{profile.publicPostsCount}</span>
            </div>
            <div className="text-center sm:text-left">
              <span className="text-xs uppercase font-bold text-slate-500 block">Shared Analyses</span>
              <span className="text-xl font-extrabold text-blue-400">{profile.sharedAnalysesCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "posts"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>All Public Posts ({profile.publicPostsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analyses")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "analyses"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Shared Analyses ({profile.sharedAnalysesCount})</span>
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {postsToDisplay.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs italic">
            No public contributions in this category yet.
          </div>
        ) : (
          postsToDisplay.map((post) => (
            <CommunityPostCard
              key={post.postId}
              post={post}
              currentUser={currentUser}
              onLikeToggle={onLikeToggle}
              isLiked={likedPostIds.has(post.postId)}
              onEditPost={onEditPost}
              onDeletePost={onDeletePost}
              onTogglePublish={onTogglePublish}
              onReportPost={onReportPost}
              onReportComment={onReportComment}
              onViewProfile={() => {}}
              onViewAnalysis={onViewAnalysis}
            />
          ))
        )}
      </div>
    </div>
  );
}
