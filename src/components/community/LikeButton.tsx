import React, { useState } from "react";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  liked: boolean;
  likeCount: number;
  onToggle: () => Promise<void>;
  disabled?: boolean;
}

export function LikeButton({ liked, likeCount, onToggle, disabled = false }: LikeButtonProps) {
  const [isLiking, setIsLiking] = useState(false);

  const handleClick = async () => {
    if (disabled || isLiking) return;
    setIsLiking(true);
    try {
      await onToggle();
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLiking}
      aria-label={liked ? `Unlike post (${likeCount} likes)` : `Like post (${likeCount} likes)`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
        liked
          ? "text-rose-400 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/15"
          : "text-slate-400 bg-slate-900/60 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/60"
      } ${isLiking ? "opacity-75" : ""}`}
    >
      <Heart
        className={`w-4 h-4 transition-transform duration-200 ${
          liked ? "fill-rose-400 text-rose-400 scale-110" : "text-slate-400 group-hover:scale-105"
        }`}
      />
      <span>{likeCount}</span>
    </button>
  );
}
