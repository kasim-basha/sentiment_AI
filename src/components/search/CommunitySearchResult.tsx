import React from "react";
import { SearchCommunityResult } from "../../types";
import { Globe, Heart, MessageSquare, Tag, Calendar, ArrowRight, Lock } from "lucide-react";

interface CommunitySearchResultProps {
  post: SearchCommunityResult;
  onViewPost: (postId: string) => void;
}

export const CommunitySearchResult: React.FC<CommunitySearchResultProps> = ({
  post,
  onViewPost
}) => {
  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div
      onClick={() => onViewPost(post.postId)}
      className="p-4 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-xl transition-all group cursor-pointer shadow-sm relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={post.authorAvatar}
            alt={post.authorName}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-slate-700/60 bg-slate-800 flex-shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors truncate">
              {post.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>By {post.authorName}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3" /> {formattedDate}
              </span>
            </div>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1">
          {post.privacy === "public" ? <Globe className="w-2.5 h-2.5 text-teal-400" /> : <Lock className="w-2.5 h-2.5 text-amber-400" />}
          <span className="capitalize">{post.privacy}</span>
        </span>
      </div>

      <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
        {post.content}
      </p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {post.tags.slice(0, 4).map((tag, idx) => (
            <span
              key={`${tag}_${idx}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-medium"
            >
              <Tag className="w-2.5 h-2.5" /> #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Metrics */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-400">
            <Heart className="w-3.5 h-3.5 text-rose-400" /> {post.likesCount} likes
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> {post.commentsCount} comments
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-teal-400 transition-colors font-semibold">
          <span>View Discussion</span>
          <ArrowRight className="w-3.5 h-3.5 -translate-x-0.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
