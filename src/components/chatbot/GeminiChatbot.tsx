import { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import {
  Sparkles,
  Bot,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  Zap,
  HeartHandshake,
  BarChart2,
  Briefcase,
  Smile,
  Search,
  Download,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  Info,
  Loader2,
  User as UserIcon,
  HelpCircle,
  FileCode
} from "lucide-react";
import { User, ViewState } from "../../types";
import {
  chatbotClientService,
  ChatThread,
  ChatMessage,
  ChatbotPersona,
  PersonaInfo
} from "../../services/chatbotService";

interface GeminiChatbotProps {
  currentUser: User;
  onNavigate?: (view: ViewState) => void;
  initialContext?: string;
  initialPrompt?: string;
}

const PERSONA_ICONS: Record<ChatbotPersona, any> = {
  general: Sparkles,
  coach: HeartHandshake,
  analyst: BarChart2,
  executive: Briefcase,
  counselor: Smile
};

const SUGGESTED_PROMPTS = [
  {
    category: "Tone Calibration",
    prompt: "Can you analyze the tone of this email and suggest how to make it sound more collaborative?",
    persona: "executive" as ChatbotPersona
  },
  {
    category: "Conflict De-escalation",
    prompt: "How should I respond to an upset team member who feels their contribution was overlooked?",
    persona: "coach" as ChatbotPersona
  },
  {
    category: "Sentiment Theory",
    prompt: "What is the difference between sentiment polarity and emotional arousal in AI analysis?",
    persona: "analyst" as ChatbotPersona
  },
  {
    category: "Empathy & Support",
    prompt: "I feel overwhelmed by critical feedback today. How can I process it productively?",
    persona: "counselor" as ChatbotPersona
  }
];

export function GeminiChatbot({
  currentUser,
  onNavigate,
  initialContext,
  initialPrompt
}: GeminiChatbotProps) {
  const [personas, setPersonas] = useState<PersonaInfo[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedPersona, setSelectedPersona] = useState<ChatbotPersona>("general");
  const [threadSearch, setThreadSearch] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPersonaPicker, setShowPersonaPicker] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load Personas & Threads on mount
  useEffect(() => {
    chatbotClientService.getPersonas().then(setPersonas);

    const loadedThreads = chatbotClientService.loadThreads();
    if (loadedThreads.length > 0) {
      setThreads(loadedThreads);
      setActiveThreadId(loadedThreads[0].id);
      setSelectedPersona(loadedThreads[0].persona);
    } else {
      const defaultThread = chatbotClientService.createNewThread("general", "Welcome to Gemini AI");
      // Add welcome message
      defaultThread.messages.push({
        id: "msg_welcome",
        role: "model",
        content: `👋 Hello **${currentUser.name || "there"}**! I am your **Gemini Emotion & Sentiment AI Assistant**.\n\nI can help you with:\n* 🧠 **Sentiment & Tone Analysis**: Unpacking subtle emotional undertones in messages and documents\n* 🤝 **Interpersonal EQ Coaching**: Navigating difficult conversations and active listening\n* ✍️ **Tone Calibration**: Refining emails and announcements to strike the perfect tone\n* 📊 **Psycholinguistic Insights**: Understanding emotional valence, arousal, and intent markers\n\nHow can I help you today? Choose a prompt below or type any message!`,
        timestamp: new Date().toISOString(),
        persona: "general",
        suggestedFollowUps: [
          "How can I improve my team's emotional safety?",
          "Analyze the tone of my apology draft",
          "Explain emotional valence vs arousal"
        ]
      });
      setThreads([defaultThread]);
      setActiveThreadId(defaultThread.id);
      chatbotClientService.saveThreads([defaultThread], currentUser.id);
    }
  }, [currentUser.name, currentUser.id]);

  // Handle initial prompt if provided
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  // Auto-scroll on new messages
  const activeThread = threads.find((t) => t.id === activeThreadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleCreateNewThread = (persona: ChatbotPersona = selectedPersona) => {
    const newThread = chatbotClientService.createNewThread(persona, `Chat with ${getPersonaName(persona)}`);
    const updated = [newThread, ...threads];
    setThreads(updated);
    setActiveThreadId(newThread.id);
    setSelectedPersona(persona);
    chatbotClientService.saveThreads(updated, currentUser.id);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleDeleteThread = (threadId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const remaining = threads.filter((t) => t.id !== threadId);
    setThreads(remaining);
    chatbotClientService.saveThreads(remaining, currentUser.id);
    if (activeThreadId === threadId) {
      if (remaining.length > 0) {
        setActiveThreadId(remaining[0].id);
        setSelectedPersona(remaining[0].persona);
      } else {
        handleCreateNewThread(selectedPersona);
      }
    }
  };

  const handleClearAllThreads = () => {
    if (window.confirm("Are you sure you want to clear all chat conversations?")) {
      const newThread = chatbotClientService.createNewThread("general", "New Conversation");
      setThreads([newThread]);
      setActiveThreadId(newThread.id);
      chatbotClientService.saveThreads([newThread], currentUser.id);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    let currentThread = threads.find((t) => t.id === activeThreadId);
    if (!currentThread) {
      currentThread = chatbotClientService.createNewThread(selectedPersona, messageContent.slice(0, 30));
      setThreads([currentThread, ...threads]);
      setActiveThreadId(currentThread.id);
    }

    const userMsg: ChatMessage = {
      id: "msg_u_" + Date.now(),
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    // Update thread title if it's the first user message
    const isFirstUserMsg = currentThread.messages.filter((m) => m.role === "user").length === 0;
    const newTitle = isFirstUserMsg ? messageContent.slice(0, 35) + (messageContent.length > 35 ? "..." : "") : currentThread.title;

    const updatedMessages = [...currentThread.messages, userMsg];
    const updatedThread: ChatThread = {
      ...currentThread,
      title: newTitle,
      persona: selectedPersona,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    const updatedThreadsList = threads.map((t) => (t.id === currentThread!.id ? updatedThread : t));
    setThreads(updatedThreadsList);
    chatbotClientService.saveThreads(updatedThreadsList, currentUser.id);

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      // Build history payload for Gemini SDK
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await chatbotClientService.sendMessage({
        messages: historyPayload,
        persona: selectedPersona,
        context: initialContext
      });

      const modelMsg: ChatMessage = {
        id: "msg_m_" + Date.now(),
        role: "model",
        content: response.reply,
        timestamp: response.timestamp,
        persona: response.persona,
        suggestedFollowUps: response.suggestedFollowUps
      };

      const finalThread: ChatThread = {
        ...updatedThread,
        messages: [...updatedMessages, modelMsg],
        updatedAt: new Date().toISOString()
      };

      const finalThreadsList = threads.map((t) => (t.id === currentThread!.id ? finalThread : t));
      setThreads(finalThreadsList);
      chatbotClientService.saveThreads(finalThreadsList, currentUser.id);
    } catch (err: any) {
      console.warn("Failed to send chat message:", err);
      const errorMsg: ChatMessage = {
        id: "msg_err_" + Date.now(),
        role: "model",
        content: `⚠️ **Connection Note**: ${err.message || "Could not reach Gemini service. Please try again."}`,
        timestamp: new Date().toISOString(),
        persona: selectedPersona
      };
      const errorThread: ChatThread = {
        ...updatedThread,
        messages: [...updatedMessages, errorMsg],
        updatedAt: new Date().toISOString()
      };
      const errThreadsList = threads.map((t) => (t.id === currentThread!.id ? errorThread : t));
      setThreads(errThreadsList);
      chatbotClientService.saveThreads(errThreadsList, currentUser.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    if (!activeThread) return;
    const markdownContent = `# ${activeThread.title}\n*Persona: ${activeThread.persona} | Exported: ${new Date().toLocaleString()}*\n\n---\n\n` +
      activeThread.messages
        .map((m) => `### ${m.role === "user" ? currentUser.name || "User" : "Gemini AI"} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n`)
        .join("---\n\n");

    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gemini-chat-${activeThread.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPersonaName = (p: ChatbotPersona) => {
    const found = personas.find((item) => item.id === p);
    return found ? found.name : "Gemini Emotion AI";
  };

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(threadSearch.toLowerCase()) ||
    t.messages.some((m) => m.content.toLowerCase().includes(threadSearch.toLowerCase()))
  );

  const ActiveIcon = PERSONA_ICONS[selectedPersona] || Sparkles;

  return (
    <div className="h-[calc(100vh-4rem)] max-w-7xl mx-auto px-2 sm:px-4 py-3 flex flex-col">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
              <ActiveIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Gemini Chatbot</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-blue-300">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multimodal Sentiment & Emotional Intelligence Conversation Partner
              </p>
            </div>
          </div>
        </div>

        {/* Persona Selector & Header Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPersonaPicker(!showPersonaPicker)}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ActiveIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{getPersonaName(selectedPersona)}</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            {/* Persona Dropdown Menu */}
            {showPersonaPicker && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Select AI Specialist Persona
                </div>
                <div className="space-y-1 mt-1 max-h-80 overflow-y-auto">
                  {personas.map((p) => {
                    const PIcon = PERSONA_ICONS[p.id] || Sparkles;
                    const isSelected = selectedPersona === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPersona(p.id);
                          setShowPersonaPicker(false);
                          if (activeThread && activeThread.messages.length === 0) {
                            activeThread.persona = p.id;
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                          isSelected ? "bg-blue-600/20 border border-blue-500/40 text-white" : "hover:bg-slate-800/70 text-slate-300"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                          <PIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{p.tagline}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportChat}
            disabled={!activeThread || activeThread.messages.length === 0}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors disabled:opacity-40 cursor-pointer"
            title="Export Conversation as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer sm:hidden"
            title="Toggle Threads"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace: Sidebar & Chat Area */}
      <div className="flex-1 flex gap-3 min-h-0 pt-3">
        {/* Left Sidebar (Thread History & New Chat) */}
        <div
          className={`${
            isSidebarOpen ? "flex" : "hidden sm:flex"
          } w-full sm:w-64 md:w-72 flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 shrink-0`}
        >
          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => handleCreateNewThread(selectedPersona)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          {/* Search Threads */}
          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search chat history..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 mt-3 pr-1">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 italic">
                No conversations found.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const ThreadIcon = PERSONA_ICONS[thread.persona] || Sparkles;
                return (
                  <div
                    key={thread.id}
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setSelectedPersona(thread.persona);
                    }}
                    className={`group w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                      isActive
                        ? "bg-blue-600/15 border-blue-500/30 text-white font-medium"
                        : "bg-slate-950/40 border-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <ThreadIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                      <div className="truncate text-xs font-semibold">{thread.title || "Untitled Chat"}</div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity ml-1 cursor-pointer"
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Clear All Footer */}
          {threads.length > 1 && (
            <div className="pt-2 border-t border-slate-800/80 mt-2 flex justify-between items-center text-[11px] text-slate-500">
              <span>{threads.length} chats</span>
              <button
                type="button"
                onClick={handleClearAllThreads}
                className="hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Chat Conversation View */}
        <div className="flex-1 flex flex-col rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden relative">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {(!activeThread || activeThread.messages.length === 0) && (
              <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/30 via-cyan-500/20 to-indigo-600/30 border border-blue-500/30 mx-auto flex items-center justify-center text-blue-400 shadow-2xl shadow-blue-500/20 animate-pulse">
                  <ActiveIcon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    {getPersonaName(selectedPersona)}
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Powered by Google Gemini 3.8 Flash. Ask questions, analyze conversation tone, practice de-escalation, or explore psycholinguistic dimensions.
                  </p>
                </div>

                {/* Quick Prompts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  {SUGGESTED_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPersona(item.persona);
                        handleSendMessage(item.prompt);
                      }}
                      className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1 flex items-center justify-between">
                        <span>{item.category}</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-2">
                        {item.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {activeThread?.messages.map((msg) => {
              const isUser = msg.role === "user";
              const MsgIcon = msg.persona ? PERSONA_ICONS[msg.persona] || Sparkles : Sparkles;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5 shadow-md">
                      <MsgIcon className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-2xl ${isUser ? "order-1" : "order-2"}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
                        isUser
                          ? "bg-blue-600 text-white border-blue-500/40 shadow-lg shadow-blue-600/10 rounded-tr-sm"
                          : "bg-slate-900/90 text-slate-200 border-slate-800/90 shadow-lg rounded-tl-sm"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                      ) : (
                        <div className="markdown-body prose prose-invert max-w-none text-xs sm:text-sm space-y-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-blue-300 [&_h3]:mt-3 [&_strong]:text-white [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-700 [&_th]:p-1.5 [&_th]:bg-slate-800 [&_td]:border [&_td]:border-slate-800 [&_td]:p-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:bg-slate-950 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cyan-300">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      )}
                    </div>

                    {/* Message Metadata & Copy Action */}
                    <div className={`flex items-center gap-2 mt-1.5 px-1 text-[11px] text-slate-500 ${isUser ? "justify-end" : "justify-start"}`}>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, msg.id)}
                          className="hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Suggested Follow-Ups */}
                    {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((followUp, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendMessage(followUp)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>{followUp}</span>
                            <ChevronRight className="w-2.5 h-2.5 text-slate-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 shadow-md">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-md animate-pulse">
                  <ActiveIcon className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-xs text-slate-300 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="italic">Gemini is synthesizing insights...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Composer Section */}
          <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative rounded-2xl bg-slate-900/90 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all shadow-inner"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={`Ask ${getPersonaName(selectedPersona)} anything about tone, empathy, or sentiment... (Enter to send)`}
                className="w-full px-4 py-3.5 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-44 min-h-[48px]"
              />

              <div className="flex items-center justify-between px-3 pb-2.5 pt-1 text-slate-400 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Shift+Enter for new line
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    {input.length} chars
                  </span>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
