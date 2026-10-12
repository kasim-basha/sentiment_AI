import { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import {
  Sparkles,
  Bot,
  X,
  Send,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  MessageSquare
} from "lucide-react";
import { User, ViewState } from "../../types";
import { chatbotClientService, ChatMessage, ChatbotPersona } from "../../services/chatbotService";

interface GeminiFloatingChatProps {
  currentUser: User;
  onNavigate?: (view: ViewState) => void;
}

export function GeminiFloatingChat({ currentUser, onNavigate }: GeminiFloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<ChatbotPersona>("general");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "float_welcome",
          role: "model",
          content: `Hi ${currentUser.name || "there"}! 👋 Need quick sentiment insights, advice on drafting a message, or an emotion check? Ask me anytime!`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [currentUser.name, messages.length]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const historyPayload = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await chatbotClientService.sendMessage({
        messages: historyPayload,
        persona
      });

      const modelMsg: ChatMessage = {
        id: "m_" + Date.now(),
        role: "model",
        content: res.reply,
        timestamp: res.timestamp,
        suggestedFollowUps: res.suggestedFollowUps
      };

      setMessages([...newMessages, modelMsg]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: "err_" + Date.now(),
          role: "model",
          content: `⚠️ ${err.message || "Failed to reach Gemini."}`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-2xl shadow-blue-600/40 hover:shadow-blue-600/60 transition-all duration-300 hover:scale-105 cursor-pointer border border-blue-400/30"
          aria-label="Open Gemini Chatbot"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>
          <span className="tracking-wide">Gemini AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-96 h-[520px] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Gemini Chatbot</span>
                  <span className="text-[10px] text-blue-400 font-mono">3.8 Flash</span>
                </h3>
                <p className="text-[10px] text-slate-400">Emotion & Sentiment Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate("chatbot" as ViewState);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Open Full Page Chat"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setMessages([])}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Persona Pills */}
          <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0 scrollbar-none">
            {[
              { id: "general", label: "✨ General" },
              { id: "coach", label: "🤝 EQ Coach" },
              { id: "analyst", label: "📊 Analyst" },
              { id: "executive", label: "💼 Executive" }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersona(p.id as ChatbotPersona)}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  persona === p.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="markdown-body text-xs space-y-1.5 [&_ul]:list-disc [&_ul]:pl-3.5 [&_ol]:list-decimal [&_ol]:pl-3.5 [&_strong]:text-white [&_p]:mb-1">
                        <Markdown>{m.content}</Markdown>
                      </div>
                    )}

                    {!isUser && (
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-700/50 text-[10px] text-slate-400">
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.content, m.id)}
                          className="hover:text-white cursor-pointer"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 focus-within:border-blue-500"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Gemini anything..."
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
