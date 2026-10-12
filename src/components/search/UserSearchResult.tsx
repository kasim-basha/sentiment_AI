import React from "react";
import { SearchUserResult } from "../../types";
import { UserPlus, UserCheck, Clock, MessageSquare, ShieldAlert } from "lucide-react";

interface UserSearchResultProps {
  user: SearchUserResult;
  onSendFriendRequest?: (userId: string) => void;
  onOpenChat?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export const UserSearchResult: React.FC<UserSearchResultProps> = ({
  user,
  onSendFriendRequest,
  onOpenChat,
  onViewProfile
}) => {
  const getStatusBadge = () => {
    switch (user.status) {
      case "friends":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-3 h-3" /> Friends
          </span>
        );
      case "pending_sent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Request Sent
          </span>
        );
      case "pending_received":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <UserPlus className="w-3 h-3" /> Incoming Request
          </span>
        );
      case "blocked":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3 h-3" /> Blocked
          </span>
        );
      case "self":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            You
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-3.5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all group shadow-sm">
      <div
        className="flex items-center gap-3.5 min-w-0 cursor-pointer"
        onClick={() => onViewProfile && onViewProfile(user.id)}
      >
        <div className="relative flex-shrink-0">
          <img
            src={user.avatar}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-full object-cover border border-slate-700/60 group-hover:border-indigo-500/60 transition-colors bg-slate-800"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
              {user.name}
            </h4>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {user.email}
          </p>
        </div>
      </div>

      {/* Dynamic Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {user.status === "none" && onSendFriendRequest && (
          <button
            type="button"
            onClick={() => onSendFriendRequest(user.id)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Connect</span>
          </button>
        )}

        {user.status === "friends" && onOpenChat && (
          <button
            type="button"
            onClick={() => onOpenChat(user.id)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};
