import { useState, useEffect } from "react";
import {
  Users,
  MessageSquare,
  UserPlus,
  Phone,
  Video,
  ShieldAlert,
  Search,
  Check,
  X,
  UserCheck,
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Sparkles,
  UserX,
  RefreshCw
} from "lucide-react";
import {
  FriendUser,
  FriendRequestItem,
  ConversationItem,
  CallSessionItem,
  BlockedUserItem,
  CallType,
  User
} from "../../types";
import { friendService } from "../../services/friendService";
import { chatService } from "../../services/chatService";
import { callService } from "../../services/callService";
import { realtimeClient } from "../../services/realtimeClient";
import { ChatWindow } from "./ChatWindow";
import { CallModal } from "./CallModal";

interface FriendsViewProps {
  currentUser: User;
}

type TabType = "chats" | "friends" | "requests" | "find" | "calls" | "blocked";

export function FriendsView({ currentUser }: FriendsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("chats");
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [callHistory, setCallHistory] = useState<CallSessionItem[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Active Outgoing/Ongoing Call Modal
  const [activeCallSession, setActiveCallSession] = useState<CallSessionItem | null>(null);

  // Load all initial data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [fList, cList, rData, calls, bList] = await Promise.all([
        friendService.getFriends(),
        chatService.getConversations(),
        friendService.getRequests(),
        callService.getCallHistory(),
        friendService.getBlockedUsers()
      ]);

      setFriends(fList);
      setConversations(cList);
      setIncomingRequests(rData.incoming);
      setOutgoingRequests(rData.outgoing);
      setCallHistory(calls);
      setBlockedUsers(bList);

      // Auto-select first conversation if on desktop and none selected
      if (!activeConversation && cList.length > 0) {
        setActiveConversation(cList[0]);
      }
    } catch (err) {
      console.error("Error loading friends data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Listen to real-time events for instant UI updates
    const unMsg = realtimeClient.on("new_message", () => {
      chatService.getConversations().then(setConversations);
    });

    const unReqReceived = realtimeClient.on("friend_request_received", () => {
      friendService.getRequests().then(r => {
        setIncomingRequests(r.incoming);
        setOutgoingRequests(r.outgoing);
      });
    });

    const unReqAccepted = realtimeClient.on("friend_request_accepted", () => {
      loadAllData();
    });

    const unFriendRemoved = realtimeClient.on("friend_removed", () => {
      loadAllData();
    });

    const unUserOnline = realtimeClient.on("user_online", (payload) => {
      setFriends(prev => prev.map(f => f.id === payload.userId ? { ...f, isOnline: true } : f));
      setConversations(prev => prev.map(c => c.friend?.id === payload.userId ? { ...c, friend: { ...c.friend, isOnline: true } } : c));
    });

    const unUserOffline = realtimeClient.on("user_offline", (payload) => {
      setFriends(prev => prev.map(f => f.id === payload.userId ? { ...f, isOnline: false } : f));
      setConversations(prev => prev.map(c => c.friend?.id === payload.userId ? { ...c, friend: { ...c.friend, isOnline: false } } : c));
    });

    return () => {
      unMsg();
      unReqReceived();
      unReqAccepted();
      unFriendRemoved();
      unUserOnline();
      unUserOffline();
    };
  }, []);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await friendService.searchUsers(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Actions
  const handleOpenOrCreateChat = async (friend: FriendUser) => {
    try {
      const conv = await chatService.createOrGetConversation(friend.id);
      if (conv) {
        setActiveConversation(conv);
        setActiveTab("chats");
        chatService.getConversations().then(setConversations);
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
    }
  };

  const handleStartCall = async (friend: FriendUser, type: CallType) => {
    try {
      const session = await callService.initiateCall(friend.id, type);
      if (session) {
        setActiveCallSession({
          ...session,
          receiver: friend,
          peerUser: friend
        });
        callService.getCallHistory().then(setCallHistory);
      }
    } catch (err) {
      console.error("Failed to initiate call:", err);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    const res = await friendService.sendRequest(targetId);
    if (res.success) {
      // Refresh search & requests
      if (searchQuery) {
        const results = await friendService.searchUsers(searchQuery);
        setSearchResults(results);
      }
      friendService.getRequests().then(r => {
        setIncomingRequests(r.incoming);
        setOutgoingRequests(r.outgoing);
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const res = await friendService.acceptRequest(requestId);
    if (res.success) {
      loadAllData();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const res = await friendService.rejectRequest(requestId);
    if (res.success) {
      friendService.getRequests().then(r => {
        setIncomingRequests(r.incoming);
        setOutgoingRequests(r.outgoing);
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const res = await friendService.cancelRequest(requestId);
    if (res.success) {
      friendService.getRequests().then(r => {
        setIncomingRequests(r.incoming);
        setOutgoingRequests(r.outgoing);
      });
    }
  };

  const handleUnblock = async (blockedId: string) => {
    const res = await friendService.unblockUser(blockedId);
    if (res.success) {
      friendService.getBlockedUsers().then(setBlockedUsers);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-indigo-400" />
            <span>Friends & Messages</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Private direct messaging, instant audio and HD video calls with your trusted network.
          </p>
        </div>

        <button
          onClick={loadAllData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">

        {/* Left Sidebar Navigation & Sub-Lists */}
        <div className="lg:col-span-4 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">

          {/* Navigation Tabs */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("chats")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === "chats"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chats</span>
              {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("friends")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === "friends"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Friends ({friends.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer relative ${
                activeTab === "requests"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Requests</span>
              {incomingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("find")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === "find"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find</span>
            </button>

            <button
              onClick={() => setActiveTab("calls")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === "calls"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Calls</span>
            </button>

            <button
              onClick={() => setActiveTab("blocked")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === "blocked"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Blocked</span>
            </button>
          </div>

          {/* Sub-List Contents */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">

            {/* 1. CHATS TAB */}
            {activeTab === "chats" && (
              conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No conversations yet</p>
                  <p className="text-xs text-slate-500 mt-1">Select a friend to start private messaging.</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = activeConversation?._id === conv._id;
                  return (
                    <div
                      key={conv._id}
                      onClick={() => setActiveConversation(conv)}
                      className={`p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 border ${
                        isSelected
                          ? "bg-indigo-600/15 border-indigo-500/40 text-white"
                          : "bg-slate-800/40 hover:bg-slate-800/80 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow">
                          {conv.friend?.name?.charAt(0) || "U"}
                        </div>
                        {conv.friend?.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm text-white truncate">{conv.friend?.name}</h4>
                          <span className="text-[10px] text-slate-500">
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {conv.lastMessage || "Start chatting..."}
                        </p>
                      </div>

                      {(conv.unreadCount || 0) > 0 && (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })
              )
            )}

            {/* 2. FRIENDS TAB */}
            {activeTab === "friends" && (
              friends.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Your friend list is empty</p>
                  <p className="text-xs text-slate-500 mt-1">Search for users in the "Find" tab to add friends.</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
                          {friend.name.charAt(0)}
                        </div>
                        {friend.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">{friend.name}</h4>
                        <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleOpenOrCreateChat(friend)}
                        className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                        title="Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStartCall(friend, "audio")}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Audio Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStartCall(friend, "video")}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-purple-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Video Call"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* 3. REQUESTS TAB */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Incoming Requests ({incomingRequests.length})
                  </h4>
                  {incomingRequests.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No incoming friend requests.</p>
                  ) : (
                    incomingRequests.map((req) => (
                      <div
                        key={req._id}
                        className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl mb-2 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                            {req.user?.name?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{req.user?.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{req.user?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAcceptRequest(req._id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            title="Accept Request"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req._id)}
                            className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors"
                            title="Reject Request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Sent Requests ({outgoingRequests.length})
                  </h4>
                  {outgoingRequests.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No pending outgoing requests.</p>
                  ) : (
                    outgoingRequests.map((req) => (
                      <div
                        key={req._id}
                        className="p-2.5 bg-slate-800/40 border border-slate-800 rounded-xl mb-2 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                            {req.user?.name?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-200 truncate">{req.user?.name}</p>
                            <span className="text-[10px] text-amber-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending Approval
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelRequest(req._id)}
                          className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[10px] text-slate-300 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. FIND USERS TAB */}
            {activeTab === "find" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {isSearching ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Searching network...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    {searchQuery ? "No matching users found." : "Type a name or email to discover colleagues & friends."}
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 bg-slate-800/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>

                      <div>
                        {user.relationshipStatus === "friends" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Friends
                          </span>
                        ) : user.relationshipStatus === "request_sent" ? (
                          <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-medium">
                            Request Sent
                          </span>
                        ) : user.relationshipStatus === "request_received" ? (
                          <button
                            onClick={() => handleAcceptRequest(user.requestId!)}
                            className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold"
                          >
                            Accept
                          </button>
                        ) : user.relationshipStatus === "blocked" ? (
                          <span className="text-[10px] text-rose-400">Blocked</span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(user.id)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3" /> Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. CALLS TAB */}
            {activeTab === "calls" && (
              callHistory.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Phone className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No call history</p>
                  <p className="text-xs text-slate-500 mt-1">Audio and video calls with friends will appear here.</p>
                </div>
              ) : (
                callHistory.map((call) => {
                  const isCaller = call.callerId === currentUser.id;
                  const peer = call.peerUser || (isCaller ? call.receiver : call.caller);
                  const isMissed = call.status === "missed" || call.status === "rejected";

                  return (
                    <div
                      key={call._id}
                      className="p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl ${
                          isMissed
                            ? "bg-rose-500/20 text-rose-400"
                            : isCaller
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {call.type === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-semibold text-white truncate">{peer?.name || "Friend"}</h4>
                            {isCaller ? (
                              <PhoneOutgoing className="w-3 h-3 text-indigo-400" />
                            ) : isMissed ? (
                              <PhoneMissed className="w-3 h-3 text-rose-400" />
                            ) : (
                              <PhoneIncoming className="w-3 h-3 text-emerald-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(call.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            {call.duration ? ` • ${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : ` • ${call.status}`}
                          </p>
                        </div>
                      </div>

                      {peer && (
                        <button
                          onClick={() => handleStartCall(peer, call.type)}
                          className="p-2 rounded-lg bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                          title={`Call back (${call.type})`}
                        >
                          {call.type === "video" ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  );
                })
              )
            )}

            {/* 6. BLOCKED TAB */}
            {activeTab === "blocked" && (
              blockedUsers.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No blocked users</p>
                  <p className="text-xs text-slate-500 mt-1">Users you block will not be able to message or call you.</p>
                </div>
              ) : (
                blockedUsers.map((item) => (
                  <div
                    key={item._id}
                    className="p-3 bg-slate-800/50 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                        <UserX className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{item.user?.name || "User"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.user?.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnblock(item.blockedId)}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[10px] text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )
            )}

          </div>
        </div>

        {/* Right Stage: Active Chat Window or Welcome Empty State */}
        <div className="lg:col-span-8 flex flex-col h-[680px]">
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              currentUser={currentUser}
              onStartCall={handleStartCall}
              onFriendUpdated={loadAllData}
            />
          ) : (
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Connect & Communicate in Realtime</h3>
              <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
                Start private conversations, make crystal clear audio calls, or initiate high-definition video calls with friends on SentimentAI.
              </p>
              <button
                onClick={() => setActiveTab("find")}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Find & Add Friends</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Outgoing/Active Call Modal */}
      {activeCallSession && (
        <CallModal
          callSession={activeCallSession}
          currentUser={currentUser}
          onClose={() => setActiveCallSession(null)}
        />
      )}

    </div>
  );
}
