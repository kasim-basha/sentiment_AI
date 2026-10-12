import React, { useState } from "react";
import { CommunityComment, User } from "../../types";
import { Edit2, Trash2, Flag, Check, X } from "lucide-react";

interface CommentItemProps {
  key?: React.Key;
  comment: CommunityComment;
  currentUser: User;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReport: (commentId: string) => void;
}

export function CommentItem({
  comment,
  currentUser,
  onUpdate,
  onDelete,
  onReport
}: CommentItemProps) {
  const isOwner = comment.userId === currentUser.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = new Date(comment.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      setError("Comment cannot be empty.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onUpdate(comment.commentId, editContent.trim());
      setIsEditing(false);
    } catch (e: any) {
      setError(e.message || "Failed to update comment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this comment?")) {
      setIsDeleting(true);
      try {
        await onDelete(comment.commentId);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex gap-3 py-3 border-b border-slate-800/60 last:border-b-0 text-sm">
      {/* User Avatar */}
      <div className="shrink-0">
        {comment.userAvatar ? (
          <img
            src={comment.userAvatar}
            alt={comment.userName || "Commenter"}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
            {comment.userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-slate-200 truncate">
              {comment.userName || "Community Member"}
            </span>
            <span className="text-[10px] text-slate-500">
              {formattedDate}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {isOwner && !isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
                  title="Edit comment"
                  aria-label="Edit comment"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors disabled:opacity-50"
                  title="Delete comment"
                  aria-label="Delete comment"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}

            {!isOwner && (
              <button
                type="button"
                onClick={() => onReport(comment.commentId)}
                className="p-1 text-slate-500 hover:text-amber-400 rounded transition-colors"
                title="Report comment"
                aria-label="Report comment"
              >
                <Flag className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Content or Edit Mode */}
        {isEditing ? (
          <div className="mt-1.5 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              rows={2}
              maxLength={1000}
            />
            {error && <p className="text-[11px] text-rose-400">{error}</p>}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-2 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
}
