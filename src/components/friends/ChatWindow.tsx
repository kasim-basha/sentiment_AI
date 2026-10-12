import { useState, useEffect, useRef } from "react";
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  ShieldAlert,
  UserMinus,
  Smile,
  Sparkles,
  ArrowLeft,
  Info
} from "lucide-react";
import { ConversationItem, ChatMessageItem, FriendUser, CallType } from "../../types";
import { chatService } from "../../services/chatService";
import { friendService } from "../../services/friendService";
import { realtimeClient } from "../../services/realtimeClient";

interface ChatWindowProps {
  conversation: ConversationItem;
  currentUser: { id: string; name: string };
  onStartCall: (friend: FriendUser, type: CallType) => void;
  onBack?: () => void;
  onFriendUpdated?: () => void;
}

export function ChatWindow({
  conversation,
  currentUser,
  onStartCall,
  onBack,
  onFriendUpdated
}: ChatWindowProps) {
  const friend = conversation.friend;
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Load messages on conversation change
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    async function loadMessages() {
      if (!conversation._id) return;
      const data = await chatService.getMessages(conversation._id, 1, 100);
      if (mounted) {
        setMessages(data.messages);
        setIsLoading(false);
        scrollToBottom();
      }
    }

    loadMessages();

    // Listen for new messages in this conversation
    const unNewMsg = realtimeClient.on("new_message", (msg) => {
      if (msg.message && msg.message.conversationId === conversation._id) {
        setMessages(prev => [...prev, msg.message]);
        scrollToBottom();

        // Mark as read immediately if window open
        if (msg.message.receiverId === currentUser.id) {
          chatService.markAsRead(msg.message._id);
        }
      }
    });

    // Listen for message read receipts
    const unMsgRead = realtimeClient.on("message_read", (payload) => {
      if (payload.conversationId === conversation._id) {
        setMessages(prev => prev.map(m => m._id === payload.messageId ? { ...m, isRead: true } : m));
      }
    });

    // Listen for typing events
    const unTypingStart = realtimeClient.on("typing_start", (payload) => {
      if (payload.conversationId === conversation._id && payload.userId === friend?.id) {
        setIsFriendTyping(true);
      }
    });

    const unTypingStop = realtimeClient.on("typing_stop", (payload) => {
      if (payload.conversationId === conversation._id && payload.userId === friend?.id) {
        setIsFriendTyping(false);
      }
    });

    return () => {
      mounted = false;
      unNewMsg();
      unMsgRead();
      unTypingStart();
      unTypingStop();
    };
  }, [conversation._id, friend?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Emit typing indicator
    if (friend?.id) {
      realtimeClient.send({
        type: "typing_start",
        conversationId: conversation._id,
        receiverId: friend.id
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        realtimeClient.send({
          type: "typing_stop",
          conversationId: conversation._id,
          receiverId: friend.id
        });
      }, 2000);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText("");

    // Optimistic message
    const tempId = "temp_" + Date.now();
    const optimisticMessage: ChatMessageItem = {
      _id: tempId,
      conversationId: conversation._id,
      senderId: currentUser.id,
      receiverId: friend?.id || "",
      content: text,
      type: "text",
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    // Send stop typing
    if (friend?.id) {
      realtimeClient.send({
        type: "typing_stop",
        conversationId: conversation._id,
        receiverId: friend.id
      });
    }

    try {
      setIsSending(true);
      const saved = await chatService.sendMessage(conversation._id, text);
      if (saved) {
        setMessages(prev => prev.map(m => m._id === tempId ? saved : m));
      }
    } catch {
      // Keep optimistic message or mark error
    } finally {
      setIsSending(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friend?.id) return;
    if (window.confirm(`Are you sure you want to remove ${friend.name} from your friends?`)) {
      await friendService.removeFriend(friend.id);
      if (onFriendUpdated) onFriendUpdated();
    }
  };

  const handleBlockUser = async () => {
    if (!friend?.id) return;
    if (window.confirm(`Are you sure you want to block ${friend.name}? They will no longer be able to message or call you.`)) {
      await friendService.blockUser(friend.id);
      if (onFriendUpdated) onFriendUpdated();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow">
              {friend?.name?.charAt(0) || "U"}
            </div>
            {friend?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
            )}
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm leading-tight">{friend?.name || "Friend"}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              {isFriendTyping ? (
                <span className="text-indigo-400 font-medium animate-pulse">typing...</span>
              ) : friend?.isOnline ? (
                <span className="text-emerald-400">Online</span>
              ) : (
                <span>Offline</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {friend && (
            <>
              {/* Audio Call */}
              <button
                onClick={() => onStartCall(friend, "audio")}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 transition-colors cursor-pointer"
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4" />
              </button>

              {/* Video Call */}
              <button
                onClick={() => onStartCall(friend, "video")}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 transition-colors cursor-pointer"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          {/* More Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 py-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleRemoveFriend();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <UserMinus className="w-4 h-4 text-slate-400" />
                    <span>Remove Friend</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleBlockUser();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-medium"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Block User</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h4 className="text-white text-sm font-semibold mb-1">Direct Private Conversation</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              This conversation is strictly private between you and {friend?.name}. Send a message to start chatting!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUser.id;
            const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <div
                key={msg._id || index}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow ${
                    isMe
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none"
                      : "bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-none"
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                      isMe ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    <span>{time}</span>
                    {isMe && (
                      msg.isRead ? (
                        <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-cyan-300" /></span>
                      ) : (
                        <span title="Sent"><Check className="w-3.5 h-3.5 text-indigo-300" /></span>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isFriendTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>{friend?.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={`Message ${friend?.name || "friend"}...`}
          className="flex-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
