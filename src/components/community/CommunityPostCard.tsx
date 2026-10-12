import React, { useState } from "react";
import { CommunityPost, User } from "../../types";
import { PostActions } from "./PostActions";
import { CommentSection } from "./CommentSection";
import {
  Brain,
  Sparkles,
  ExternalLink,
  Globe,
  Users,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Paperclip,
  Download,
  Layers
} from "lucide-react";

interface CommunityPostCardProps {
  key?: React.Key;
  post: CommunityPost;
  currentUser: User;
  onLikeToggle: (postId: string) => Promise<void>;
  isLiked: boolean;
  onEditPost?: (post: CommunityPost) => void;
  onDeletePost?: (postId: string) => void;
  onTogglePublish?: (postId: string) => Promise<void>;
  onReportPost: (postId: string) => void;
  onReportComment: (commentId: string, postId: string) => void;
  onViewProfile: (userId: string) => void;
  onViewAnalysis?: (analysisId: string) => void;
}

export function CommunityPostCard({
  post,
  currentUser,
  onLikeToggle,
  isLiked,
  onEditPost,
  onDeletePost,
  onTogglePublish,
  onReportPost,
  onReportComment,
  onViewProfile,
  onViewAnalysis
}: CommunityPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const isOwner = post.userId === currentUser.id;

  const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  const handleQuickPublish = async () => {
    if (!onTogglePublish) return;
    setIsPublishing(true);
    try {
      await onTogglePublish(post.postId);
    } catch (e) {
      console.error("Publishing error:", e);
    } finally {
      setIsPublishing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "negative":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "mixed":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      default:
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    }
  };

  const getInputTypeIcon = (type?: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-3.5 h-3.5 text-pink-400" />;
      case "video":
        return <Video className="w-3.5 h-3.5 text-purple-400" />;
      case "mixed":
        return <Layers className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#community/post/${post.postId}`;
    navigator.clipboard.writeText(url);
  };

  const isImageFile = post.fileAttachment?.type?.startsWith("image/") || !!post.fileAttachment?.previewUrl;

  return (
    <article
      className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-5 sm:p-6 backdrop-blur-md shadow-lg hover:border-slate-700/80 transition-all duration-200"
      aria-labelledby={`post-title-${post.postId}`}
    >
      {/* Post Author Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onViewProfile(post.userId)}
            className="shrink-0 group cursor-pointer"
            aria-label={`View public profile for ${post.userName || "User"}`}
          >
            {post.userAvatar ? (
              <img
                src={post.userAvatar}
                alt={post.userName || "Author"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-blue-500 transition-all"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-700 group-hover:ring-blue-500 transition-all">
                {post.userName?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onViewProfile(post.userId)}
                className="font-bold text-sm text-white hover:text-blue-400 transition-colors truncate cursor-pointer text-left"
              >
                {post.userName || "Community Member"}
              </button>
              {isOwner && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <time dateTime={post.createdAt}>{formattedDate}</time>
              <span>•</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                {post.visibility === "public" ? (
                  <>
                    <Globe className="w-3 h-3 text-slate-400" /> Public
                  </>
                ) : (
                  <>
                    <Users className="w-3 h-3 text-slate-400" /> Community
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {post.status === "published" ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm"
              title="This post is live and published across the community"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Published</span>
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm"
                title="Draft post - not visible in main public feed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Draft</span>
              </span>
              {isOwner && onTogglePublish && (
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handleQuickPublish}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Title */}
      <h3
        id={`post-title-${post.postId}`}
        className="text-base sm:text-lg font-bold text-white mb-2 leading-snug tracking-tight"
      >
        {post.title}
      </h3>

      {/* Post Content */}
      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed mb-4">
        {post.content}
      </p>

      {/* Attached Community File Preview */}
      {post.fileAttachment && (
        <div className="mb-4 rounded-xl bg-slate-950/80 border border-slate-800 p-3 overflow-hidden">
          {isImageFile && post.fileAttachment.dataUrl ? (
            <div className="space-y-2">
              <div
                onClick={() => setIsImageExpanded(!isImageExpanded)}
                className="relative rounded-lg overflow-hidden border border-slate-800 bg-black/40 cursor-pointer group max-h-80 flex items-center justify-center"
              >
                <img
                  src={post.fileAttachment.dataUrl}
                  alt={post.fileAttachment.name}
                  className="w-full object-contain max-h-80 group-hover:scale-[1.01] transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Click to {isImageExpanded ? "collapse" : "expand"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="truncate max-w-[70%] font-medium text-slate-300">{post.fileAttachment.name}</span>
                <span className="text-[11px]">{formatFileSize(post.fileAttachment.size)}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{post.fileAttachment.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatFileSize(post.fileAttachment.size)} • {post.fileAttachment.type || "Document"}
                  </p>
                </div>
              </div>
              {post.fileAttachment.dataUrl && (
                <a
                  href={post.fileAttachment.dataUrl}
                  download={post.fileAttachment.name}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Optional Shared Analysis Card */}
      {post.sharedAnalysis && (
        <div className="mb-4 rounded-xl bg-slate-950/70 border border-slate-800 p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-200 truncate">
                  {post.sharedAnalysis.title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold">
                    {getInputTypeIcon(post.sharedAnalysis.inputType)}
                    <span>{post.sharedAnalysis.inputType} Input</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sentiment Tag */}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${getSentimentBadge(post.sharedAnalysis.sentiment)}`}>
              {post.sharedAnalysis.sentiment}
            </span>
          </div>

          {/* Emotion & Confidence telemetry */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Dominant Emotion</span>
              <span className="font-semibold text-slate-300 truncate block">
                {post.sharedAnalysis.dominantEmotion}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Confidence</span>
              <span className="font-semibold text-slate-300">
                {post.sharedAnalysis.confidence}% AI Certainty
              </span>
            </div>
          </div>

          {post.sharedAnalysis.meaningSummary && (
            <p className="text-xs text-slate-400 italic mt-2.5 line-clamp-2">
              "{post.sharedAnalysis.meaningSummary}"
            </p>
          )}

          {post.analysisId && onViewAnalysis && (
            <div className="mt-3 pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onViewAnalysis(post.analysisId!)}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View Full Analysis</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Post Actions (Like, Comment, Share, More) */}
      <PostActions
        liked={isLiked}
        likeCount={post.likeCount || 0}
        commentCount={commentCount}
        isOwner={isOwner}
        status={post.status || "published"}
        onToggleLike={() => onLikeToggle(post.postId)}
        onToggleComments={() => setShowComments(!showComments)}
        onShare={handleCopyLink}
        onEdit={onEditPost ? () => onEditPost(post) : undefined}
        onDelete={onDeletePost ? () => onDeletePost(post.postId) : undefined}
        onTogglePublish={onTogglePublish ? () => onTogglePublish(post.postId) : undefined}
        onReport={() => onReportPost(post.postId)}
      />

      {/* Comments Drawer */}
      {showComments && (
        <CommentSection
          postId={post.postId}
          currentUser={currentUser}
          onReportComment={(commentId) => onReportComment(commentId, post.postId)}
          onCommentsCountChange={(delta) => setCommentCount(prev => Math.max(0, prev + delta))}
        />
      )}
    </article>
  );
}
