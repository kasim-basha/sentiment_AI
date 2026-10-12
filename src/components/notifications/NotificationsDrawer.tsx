import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  CheckCheck,
  UserCheck,
  UserX,
  MessageSquare,
  Video,
  PhoneMissed,
  Sparkles,
  FileText,
  Heart,
  ArrowRight,
  Clock,
  Trash2,
  Check,
  PhoneCall
} from "lucide-react";
import { NotificationItem, ViewState } from "../../types";
import { notificationService } from "../../services/notificationService";
import { friendService } from "../../services/friendService";
import { realtimeClient } from "../../services/realtimeClient";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
  onViewAnalysis?: (id: string) => void;
  onViewReport?: (id: string) => void;
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  onNavigate,
  onViewAnalysis,
  onViewReport
}: NotificationsDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "friends" | "messages" | "system">("all");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [requestStatuses, setRequestStatuses] = useState<Record<string, "accepted" | "rejected">>({});

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const list = await notificationService.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const unMsg = realtimeClient.on("new_message", fetchNotifications);
    const unReq = realtimeClient.on("friend_request_received", fetchNotifications);
    const unCall = realtimeClient.on("incoming_call", fetchNotifications);

    return () => {
      unMsg();
      unReq();
      unCall();
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => (n._id === id ? { ...n, read: true, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true, isRead: true }))
    );
  };

  const handleAcceptRequest = async (notif: NotificationItem) => {
    const requestId = notif.data?.requestId;
    if (!requestId) return;

    setActionLoading(prev => ({ ...prev, [notif._id]: true }));
    try {
      await friendService.acceptRequest(requestId);
      setRequestStatuses(prev => ({ ...prev, [notif._id]: "accepted" }));
      await handleMarkAsRead(notif._id);
    } catch (err) {
      console.error("Failed to accept friend request:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [notif._id]: false }));
    }
  };

  const handleRejectRequest = async (notif: NotificationItem) => {
    const requestId = notif.data?.requestId;
    if (!requestId) return;

    setActionLoading(prev => ({ ...prev, [notif._id]: true }));
    try {
      await friendService.rejectRequest(requestId);
      setRequestStatuses(prev => ({ ...prev, [notif._id]: "rejected" }));
      await handleMarkAsRead(notif._id);
    } catch (err) {
      console.error("Failed to reject friend request:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [notif._id]: false }));
    }
  };

  const handleNotificationAction = async (notif: NotificationItem) => {
    await handleMarkAsRead(notif._id);
    onClose();

    switch (notif.type) {
      case "friend_request":
      case "friend_accepted":
      case "friend_accept":
      case "new_message":
      case "missed_call":
        onNavigate("friends");
        break;
      case "analysis_complete":
        if (notif.data?.analysisId && onViewAnalysis) {
          onViewAnalysis(notif.data.analysisId);
        } else {
          onNavigate("history");
        }
        break;
      case "report_ready":
        if (notif.data?.reportId && onViewReport) {
          onViewReport(notif.data.reportId);
        } else {
          onNavigate("reports");
        }
        break;
      case "post_like":
      case "post_comment":
        onNavigate("community");
        break;
      default:
        onNavigate("dashboard");
    }
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return "Just now";
    const date = new Date(isoString);
    const diff = (Date.now() - date.getTime()) / 1000;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read && !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    const isUnread = !n.read && !n.isRead;
    if (filter === "unread") return isUnread;
    if (filter === "friends") return n.type === "friend_request" || n.type === "friend_accepted" || n.type === "missed_call";
    if (filter === "messages") return n.type === "new_message";
    if (filter === "system") return n.type === "analysis_complete" || n.type === "report_ready" || n.type === "post_like" || n.type === "post_comment";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-xs font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">Activity and system alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 text-xs text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: "Unread" },
              { id: "friends", label: "Friends & Calls" },
              { id: "messages", label: "Messages" },
              { id: "system", label: "AI & Feed" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filter === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading updates...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">No notifications found</p>
                  <p className="text-xs text-slate-500 mt-1">You're all caught up with your updates!</p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = !notif.read && !notif.isRead;
                const reqStatus = requestStatuses[notif._id];

                return (
                  <div
                    key={notif._id}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 ${
                      isUnread
                        ? "bg-slate-800/90 border-indigo-500/40 shadow-lg shadow-indigo-950/20"
                        : "bg-slate-800/40 border-slate-800/70 hover:bg-slate-800/60"
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-indigo-400/20" />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Icon Avatar */}
                      {notif.type === "friend_request" && (
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <UserCheck className="w-5 h-5" />
                        </div>
                      )}

                      {notif.type === "new_message" && (
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                      )}

                      {notif.type === "missed_call" && (
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                          <PhoneMissed className="w-5 h-5" />
                        </div>
                      )}

                      {notif.type === "analysis_complete" && (
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                      )}

                      {notif.type === "report_ready" && (
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      {notif.type === "post_like" && (
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                          <Heart className="w-5 h-5 fill-rose-500/20" />
                        </div>
                      )}

                      {notif.type === "post_comment" && (
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                      )}

                      {/* Content Area */}
                      <div className="flex-1 pr-4">
                        {/* Specific Header / Title */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {notif.type === "friend_request" && "Connection Request"}
                            {notif.type === "new_message" && "Private Message"}
                            {notif.type === "missed_call" && "Missed Call"}
                            {notif.type === "analysis_complete" && "Analysis Complete"}
                            {notif.type === "report_ready" && "Report Ready"}
                            {notif.type === "post_like" && "Community Like"}
                            {notif.type === "post_comment" && "Community Comment"}
                          </span>
                        </div>

                        {/* Card Description */}
                        {notif.type === "friend_request" && (
                          <div>
                            <p className="text-sm font-medium text-white">
                              <span className="font-semibold text-blue-300">{notif.data?.senderName || "Rahul"}</span> sent you a friend request
                            </p>

                            {/* Inline Accept or Reject Actions */}
                            {reqStatus === "accepted" ? (
                              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
                                <Check className="w-3.5 h-3.5" />
                                <span>Friend Request Accepted</span>
                              </div>
                            ) : reqStatus === "rejected" ? (
                              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg w-fit">
                                <span>Request Declined</span>
                              </div>
                            ) : (
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  onClick={() => handleAcceptRequest(notif)}
                                  disabled={actionLoading[notif._id]}
                                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-900/30 cursor-pointer disabled:opacity-50"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(notif)}
                                  disabled={actionLoading[notif._id]}
                                  className="px-3.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {notif.type === "new_message" && (
                          <div>
                            <p className="text-sm font-medium text-white">
                              You have a new message from <span className="font-semibold text-cyan-300">{notif.data?.senderName || "Rahul"}</span>
                            </p>
                            <div className="mt-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-200 text-xs italic font-sans flex items-start gap-2">
                              <span className="text-cyan-400 font-serif text-base leading-none">“</span>
                              <span className="flex-1">{notif.data?.content || notif.message || "Hey, how are you?"}</span>
                              <span className="text-cyan-400 font-serif text-base leading-none">”</span>
                            </div>
                            <button
                              onClick={() => handleNotificationAction(notif)}
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            >
                              <span>Reply now</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {notif.type === "missed_call" && (
                          <div>
                            <p className="text-sm font-medium text-white flex items-center gap-1.5">
                              <span className="text-rose-400 font-semibold">Missed {notif.data?.type || "video"} call</span> from {notif.data?.callerName || "Rahul"}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Incoming call was not answered
                            </p>
                            <button
                              onClick={() => handleNotificationAction(notif)}
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-rose-950/40"
                            >
                              {notif.data?.type === "video" ? <Video className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
                              <span>Call back</span>
                            </button>
                          </div>
                        )}

                        {notif.type === "analysis_complete" && (
                          <div>
                            <p className="text-sm font-medium text-white">
                              Your analysis is complete
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {notif.data?.title || "Multimodal Sentiment & Tone Analysis"}
                            </p>
                            <button
                              onClick={() => handleNotificationAction(notif)}
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>View Analysis</span>
                            </button>
                          </div>
                        )}

                        {notif.type === "report_ready" && (
                          <div>
                            <p className="text-sm font-medium text-white">
                              Your report is ready
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {notif.data?.title || "Executive Sentiment & Tone Analysis Report"}
                            </p>
                            <button
                              onClick={() => handleNotificationAction(notif)}
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Report</span>
                            </button>
                          </div>
                        )}

                        {notif.type === "post_like" && (
                          <div>
                            <p className="text-sm font-medium text-white">
                              <span className="font-semibold text-rose-300">{notif.data?.actorName || "Someone"}</span> liked your community post
                            </p>
                            <button
                              onClick={() => handleNotificationAction(notif)}
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            >
                              <span>View post</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {notif.type === "post_comment" && (
                          <div>
                            <p className="text-sm font-medium text-white">
                              <span className="font-semibold text-amber-300">{notif.data?.actorName || "Someone"}</span> commented on your post
                            </p>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 italic">
                              {notif.message}
                            </p>
                            <button
                              onClick={() => handleNotificationAction(notif)}
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                            >
                              <span>View discussion</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(notif.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
            <span>Real-time WebSocket sync enabled</span>
            <button
              onClick={fetchNotifications}
              className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              Refresh
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
