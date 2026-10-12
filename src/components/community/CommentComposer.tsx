import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { User } from "../../types";

interface CommentComposerProps {
  currentUser: User;
  onSubmit: (content: string) => Promise<void>;
}

export function CommentComposer({ currentUser, onSubmit }: CommentComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Please enter a comment.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Comment cannot exceed 1,000 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setContent("");
    } catch (err: any) {
      setError(err.message || "Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-slate-800/80">
      <div className="flex gap-2.5 items-start">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
          {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Write a constructive response or insight..."
              rows={2}
              maxLength={1000}
              className="w-full p-2.5 pr-10 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              aria-label="Add a comment"
            />
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="absolute right-2 bottom-2.5 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all cursor-pointer"
              title="Post comment"
              aria-label="Post comment"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span>{error ? <span className="text-rose-400">{error}</span> : "Markdown supported (plain text safe)"}</span>
            <span>{content.length}/1000</span>
          </div>
        </div>
      </div>
    </form>
  );
}
