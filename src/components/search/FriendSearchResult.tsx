import React from "react";
import { SearchFriendResult } from "../../types";
import { MessageSquare, Phone, Video, UserCheck, Calendar } from "lucide-react";

interface FriendSearchResultProps {
  friend: SearchFriendResult;
  onOpenChat: (friendId: string) => void;
  onStartCall: (friendId: string, type: "audio" | "video") => void;
}

export const FriendSearchResult: React.FC<FriendSearchResultProps> = ({
  friend,
  onOpenChat,
  onStartCall
}) => {
  const formattedDate = new Date(friend.friendedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="flex items-center justify-between p-3.5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all group shadow-sm">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative flex-shrink-0">
          <img
            src={friend.avatar}
            alt={friend.name}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-full object-cover border border-emerald-500/30 group-hover:border-emerald-500 transition-colors bg-slate-800"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" title="Online" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
              {friend.name}
            </h4>
            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="w-2.5 h-2.5" /> Friend
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 truncate mt-0.5">
            <span>{friend.email}</span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3" /> Connected {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Direct Contact Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
        <button
          type="button"
          onClick={() => onOpenChat(friend.id)}
          className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all border border-indigo-500/30 cursor-pointer"
          title="Send private message"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onStartCall(friend.id, "audio")}
          className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
          title="Start voice call"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onStartCall(friend.id, "video")}
          className="p-2 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
          title="Start video call"
        >
          <Video className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
