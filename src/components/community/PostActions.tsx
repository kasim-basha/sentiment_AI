import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Share2, MoreHorizontal, Edit, Trash2, Flag, Check, Send, Archive } from "lucide-react";
import { LikeButton } from "./LikeButton";
import { PostStatus } from "../../types";

interface PostActionsProps {
  liked: boolean;
  likeCount: number;
  commentCount: number;
  isOwner: boolean;
  status?: PostStatus;
  onToggleLike: () => Promise<void>;
  onToggleComments: () => void;
  onShare: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePublish?: () => Promise<void>;
  onReport: () => void;
}

export function PostActions({
  liked,
  likeCount,
  commentCount,
  isOwner,
  status = "published",
  onToggleLike,
  onToggleComments,
  onShare,
  onEdit,
  onDelete,
  onTogglePublish,
  onReport
}: PostActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleShareClick = () => {
    onShare();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublishToggle = async () => {
    if (!onTogglePublish) return;
    setIsTogglingPublish(true);
    try {
      await onTogglePublish();
      setIsMenuOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingPublish(false);
    }
  };

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Like Button */}
        <LikeButton liked={liked} likeCount={likeCount} onToggle={onToggleLike} />

        {/* Comment Button */}
        <button
          type="button"
          onClick={onToggleComments}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 bg-slate-900/60 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer active:scale-95"
          aria-label={`View comments (${commentCount})`}
        >
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>{commentCount}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShareClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 bg-slate-900/60 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer active:scale-95"
          title="Share post"
          aria-label="Share post link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>
      </div>

      {/* More Options Dropdown (Publish / Edit / Delete / Report) */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          aria-label="More post options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 bottom-full mb-1 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
            {isOwner && onTogglePublish && (
              <button
                type="button"
                disabled={isTogglingPublish}
                onClick={handlePublishToggle}
                className="w-full px-3 py-2 text-left text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {status === "published" ? (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Unpublish (Move to Draft)</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Post Now</span>
                  </>
                )}
              </button>
            )}

            {isOwner && onEdit && (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-blue-400" />
                <span>Edit Post</span>
              </button>
            )}

            {isOwner && onDelete && (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Post</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onReport();
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report Post</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
