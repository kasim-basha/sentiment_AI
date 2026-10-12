import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  X,
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  MessageSquare,
  Plus,
  Layers,
  Globe,
  Sliders,
  Lightbulb,
  BarChart2,
  ShieldCheck,
  Loader2,
  ChevronDown,
  History,
  HelpCircle
} from "lucide-react";
import {
  ClarityConversation,
  ClarityMessage,
  ClarityExplanationType,
  MultimodalAnalysisResult,
  User
} from "../../types";
import { clarityAssistantService } from "../../services/clarityAssistantService";
import { ClarityMessageBubble } from "./ClarityMessageBubble";
import { ClarityStarterPrompts } from "./ClarityStarterPrompts";
import { SUPPORTED_LANGUAGES, findLanguage, LanguageOption, stopSpeechSynthesis } from "../../utils/languages";

interface ClarityAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  analysisTitle?: string;
  analysisResult?: MultimodalAnalysisResult | null;
  initialQuestion?: string;
  initialMode?: ClarityExplanationType;
  initialSection?: string;
  user?: User;
}

export function ClarityAssistantModal({
  isOpen,
  onClose,
  analysisId,
  analysisTitle,
  analysisResult,
  initialQuestion,
  initialMode = "general",
  initialSection,
  user
}: ClarityAssistantModalProps) {
  const [conversation, setConversation] = useState<ClarityConversation | null>(null);
  const [conversationsList, setConversationsList] = useState<ClarityConversation[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<ClarityExplanationType>(initialMode || "general");
  const [selectedSection, setSelectedSection] = useState<string | undefined>(initialSection);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(() => findLanguage("English"));
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, isSending]);

  // Clean up voice when closed
  useEffect(() => {
    if (!isOpen) {
      stopSpeechSynthesis();
    }
  }, [isOpen]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize or load conversation on open
  useEffect(() => {
    if (!isOpen || !analysisId) return;

    let isMounted = true;

    async function initAssistant() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch existing conversations for this analysis
        const convList = await clarityAssistantService.getConversations(analysisId);
        if (!isMounted) return;
        setConversationsList(convList);

        if (convList.length > 0) {
          // Load latest conversation
          const latest = await clarityAssistantService.getConversation(convList[0]._id);
          if (!isMounted) return;
          setConversation(latest);

          // If an initial question was passed and latest has no messages or user wants immediate ask
          if (initialQuestion && latest.messages && latest.messages.length === 0) {
            handleSend(initialQuestion, initialMode, initialSection);
          }
        } else {
          // Create new conversation
          const newConv = await clarityAssistantService.createConversation({
            analysisId,
            title: analysisTitle ? `Clarify: ${analysisTitle.slice(0, 35)}` : undefined,
            initialQuestion: initialQuestion || undefined,
            mode: initialMode,
            language: selectedLanguage.name
          });
          if (!isMounted) return;
          setConversation(newConv);
          setConversationsList([newConv]);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Failed to initialize Clarity Assistant:", err);
        setError(err?.message || "Could not load AI Clarity Assistant.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAssistant();

    return () => {
      isMounted = false;
    };
  }, [isOpen, analysisId]);

  const handleStartNewConversation = async () => {
    if (!analysisId) return;
    setIsLoading(true);
    setError(null);
    try {
      const newConv = await clarityAssistantService.createConversation({
        analysisId,
        title: `Clarity Assistant - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        mode,
        language: selectedLanguage.name
      });
      setConversation(newConv);
      setConversationsList(prev => [newConv, ...prev]);
      setIsHistoryOpen(false);
    } catch (err: any) {
      setError(err?.message || "Failed to create new conversation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setIsLoading(true);
    setIsHistoryOpen(false);
    try {
      const conv = await clarityAssistantService.getConversation(convId);
      setConversation(conv);
    } catch (err: any) {
      setError(err?.message || "Failed to switch conversation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this conversation thread?")) return;
    try {
      await clarityAssistantService.deleteConversation(convId);
      setConversationsList(prev => prev.filter(c => c._id !== convId));
      if (conversation?._id === convId) {
        const remaining = conversationsList.filter(c => c._id !== convId);
        if (remaining.length > 0) {
          handleSelectConversation(remaining[0]._id);
        } else {
          handleStartNewConversation();
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to delete conversation.");
    }
  };

  const handleSend = async (
    textToSend?: string,
    customMode?: ClarityExplanationType,
    customSection?: string
  ) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    if (!conversation) {
      // Create first
      try {
        const newConv = await clarityAssistantService.createConversation({
          analysisId,
          initialQuestion: text,
          mode: customMode || mode,
          language: selectedLanguage.name
        });
        setConversation(newConv);
        setConversationsList(prev => [newConv, ...prev]);
        setInputText("");
        return;
      } catch (err: any) {
        setError(err?.message || "Failed to send message.");
        return;
      }
    }

    const activeMode = customMode || mode;
    const activeSection = customSection || selectedSection;

    // Optimistically add user message
    const tempUserMsg: ClarityMessage = {
      _id: `temp_${Date.now()}`,
      conversationId: conversation._id,
      role: "user",
      content: text,
      explanationType: activeMode,
      createdAt: new Date().toISOString()
    };

    setConversation(prev => prev ? {
      ...prev,
      messages: [...(prev.messages || []), tempUserMsg]
    } : null);

    setInputText("");
    setIsSending(true);
    setError(null);

    try {
      const res = await clarityAssistantService.sendMessage({
        conversationId: conversation._id,
        content: text,
        mode: activeMode,
        section: activeSection,
        language: selectedLanguage.name
      });

      setConversation(prev => {
        if (!prev) return null;
        const filtered = (prev.messages || []).filter(m => m._id !== tempUserMsg._id);
        return {
          ...prev,
          messages: [...filtered, res.userMessage, res.assistantMessage]
        };
      });
    } catch (err: any) {
      console.error("Clarity assistant error:", err);
      setError(err?.message || "Failed to get AI response. Please try again.");
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const sentimentLabel = analysisResult?.overall_sentiment?.label || "Neutral";
  const sentimentScore = analysisResult?.overall_sentiment?.score ?? 0.5;
  const dominantEmotion = analysisResult?.emotions?.dominant?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl h-[90vh] max-h-[850px] bg-slate-950 border border-slate-800/90 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between gap-4 z-10 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-600/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>SentimentAI Assistant</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">
                    💡 AI Clarity
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-blue-300 font-semibold">{analysisId}</span>
                <span>•</span>
                <span className={`font-semibold ${
                  sentimentLabel === "Positive" ? "text-emerald-400" :
                  sentimentLabel === "Negative" ? "text-rose-400" :
                  sentimentLabel === "Mixed" ? "text-purple-400" : "text-amber-400"
                }`}>
                  {sentimentLabel} ({Math.round(sentimentScore * 100)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Thread History Switcher */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isHistoryOpen
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
              }`}
              title="Conversation history"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Threads ({conversationsList.length})</span>
            </button>

            {/* New Thread */}
            <button
              type="button"
              onClick={handleStartNewConversation}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Start fresh conversation thread"
            >
              <Plus className="w-4 h-4 text-blue-400" />
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer ml-1"
              title="Close assistant (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector & Quick Filters Sub-Bar */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs z-10 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMode("simple")}
              className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === "simple"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>✨ Simple Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("detailed")}
              className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === "detailed"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>📊 Detailed Mode</span>
            </button>
          </div>

          {/* Quick Section Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            {[
              { id: "overallSentiment", label: "🏷️ Sentiment Score" },
              { id: "emotions", label: "🎭 Emotions" },
              { id: "confidence", label: "🎯 Confidence" },
              { id: "sentiment_coaching", label: "🚀 Coaching" },
              { id: "multimodalRelationship", label: "👁️ Multimodal" },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  if (selectedSection === sec.id) {
                    setSelectedSection(undefined);
                  } else {
                    setSelectedSection(sec.id);
                    handleSend(`Can you please explain the ${sec.label.slice(3)} section of this analysis?`, mode, sec.id);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSection === sec.id
                    ? "bg-blue-500/20 border border-blue-400 text-blue-300"
                    : "bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800">
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={selectedLanguage.code}
              onChange={(e) => {
                const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                if (found) setSelectedLanguage(found);
              }}
              className="bg-transparent text-slate-300 font-bold focus:outline-none cursor-pointer text-xs pr-1"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Main Body / Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative">
          {/* Threads History Dropdown Drawer */}
          {isHistoryOpen && (
            <div className="absolute top-4 right-4 z-30 w-80 max-h-96 bg-slate-900/95 border border-slate-700/80 rounded-3xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Previous Clarification Threads
                </span>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-slate-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-64 scrollbar-thin">
                {conversationsList.map((conv) => (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv._id)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      conversation?._id === conv._id
                        ? "bg-blue-600/20 border-blue-500/40 text-blue-200"
                        : "bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold truncate">{conv.title || "Clarity Session"}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(conv.updatedAt).toLocaleDateString()} at {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(conv._id, e)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-sm font-semibold">Connecting to SentimentAI Clarity Assistant...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Notice</p>
                <p className="text-xs text-rose-200 mt-0.5">{error}</p>
                <button
                  type="button"
                  onClick={() => handleSend("Can you explain the main summary of this analysis?")}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                >
                  Retry Request
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* If no messages yet, show welcoming banner and starter questions */}
              {(!conversation?.messages || conversation.messages.length === 0) && (
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-purple-600/15 border border-blue-500/20 backdrop-blur-xl text-center max-w-xl mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3 text-blue-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-black text-white tracking-tight mb-2">
                      How can I clarify your results?
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      I will explain your sentiment score, emotion breakdown, and multimodal observations in plain, jargon-free language grounded in your verified data.
                    </p>
                  </div>

                  <ClarityStarterPrompts
                    onSelectPrompt={(prompt, promptMode, promptSection) => {
                      handleSend(prompt, promptMode, promptSection);
                    }}
                    sentimentLabel={sentimentLabel}
                    score={sentimentScore}
                    dominantEmotion={dominantEmotion}
                  />
                </div>
              )}

              {/* Message thread */}
              {conversation?.messages && conversation.messages.map((msg) => (
                <ClarityMessageBubble
                  key={msg._id}
                  message={msg}
                  user={user}
                  languageCode={selectedLanguage.code}
                  onSectionClick={(sec) => {
                    handleSend(`Can you provide a deeper breakdown of the ${sec} section?`, "detailed", sec);
                  }}
                />
              ))}

              {/* Live Loading / Thinking Indicator */}
              {isSending && (
                <div className="flex items-center gap-3 text-slate-400 text-xs py-2 px-2 animate-pulse">
                  <div className="w-8 h-8 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-200">🧠 Analyzing your question...</span>
                    <span className="text-[11px] text-slate-400">Synthesizing findings in {selectedLanguage.flag} {selectedLanguage.name} ({mode} mode)</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 3. Input Footer Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur-xl shrink-0 z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2.5 bg-slate-950 border border-slate-800 focus-within:border-blue-500/60 rounded-3xl p-2.5 sm:p-3 shadow-inner transition-colors"
          >
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask anything about this analysis in simple language... (e.g. "Why is my score ${Math.round(sentimentScore * 100)}%?")`}
              rows={1}
              disabled={isSending}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none px-2 py-1 max-h-32 scrollbar-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-600 font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95 shrink-0"
              title="Send question (Enter)"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-2.5 px-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Grounded in verified session data • Non-clinical AI clarification</span>
            </span>
            <span className="hidden sm:inline font-mono">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}
