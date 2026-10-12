import React, { useState, useEffect } from "react";
import { CommunityComment, User } from "../../types";
import { communityService } from "../../services/communityService";
import { CommentItem } from "./CommentItem";
import { CommentComposer } from "./CommentComposer";
import { Loader2 } from "lucide-react";

interface CommentSectionProps {
  postId: string;
  currentUser: User;
  onReportComment: (commentId: string) => void;
  onCommentsCountChange?: (delta: number) => void;
}

export function CommentSection({
  postId,
  currentUser,
  onReportComment,
  onCommentsCountChange
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const list = await communityService.getComments(postId);
        if (isMounted) setComments(list);
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleCreateComment = async (content: string) => {
    const newComment = await communityService.createComment(
      postId,
      currentUser.id,
      currentUser.name,
      undefined,
      content
    );
    setComments(prev => [...prev, newComment]);
    if (onCommentsCountChange) onCommentsCountChange(1);
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    const updated = await communityService.updateComment(commentId, currentUser.id, content);
    setComments(prev => prev.map(c => c.commentId === commentId ? updated : c));
  };

  const handleDeleteComment = async (commentId: string) => {
    await communityService.deleteComment(commentId, currentUser.id, currentUser.role === "admin");
    setComments(prev => prev.filter(c => c.commentId !== commentId));
    if (onCommentsCountChange) onCommentsCountChange(-1);
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Discussion & Observations ({comments.length})
      </h4>

      {isLoading ? (
        <div className="py-4 flex items-center justify-center text-slate-500 gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500 italic bg-slate-900/30 rounded-xl border border-slate-800/50">
          No comments yet. Start the conversation!
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              currentUser={currentUser}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
              onReport={onReportComment}
            />
          ))}
        </div>
      )}

      {/* Add new comment */}
      <CommentComposer
        currentUser={currentUser}
        onSubmit={handleCreateComment}
      />
    </div>
  );
}
