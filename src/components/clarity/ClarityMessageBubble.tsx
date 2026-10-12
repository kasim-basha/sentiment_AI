import React, { useState } from "react";
import Markdown from "react-markdown";
import {
  Brain,
  User as UserIcon,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Tag,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { ClarityMessage, User } from "../../types";
import { speakSpeechSynthesis, stopSpeechSynthesis } from "../../utils/languages";

interface ClarityMessageBubbleProps {
  message: ClarityMessage;
  user?: User;
  languageCode?: string;
  onSectionClick?: (section: string) => void;
}

export function ClarityMessageBubble({
  message,
  user,
  languageCode = "en-US",
  onSectionClick
}: ClarityMessageBubbleProps) {
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  const handleToggleSpeech = () => {
    if (isPlaying) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          setIsPaused(true);
          return;
        } else if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
          return;
        }
      }
      stopSpeechSynthesis();
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);

    // Strip Markdown symbols for cleaner TTS speech
    const cleanText = message.content
      .replace(/[#*_`~>-]/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .trim();

    speakSpeechSynthesis(
      cleanText,
      languageCode,
      1.0,
      () => {
        setIsPlaying(true);
        setIsPaused(false);
      },
      () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
      () => {
        setIsPlaying(false);
        setIsPaused(false);
      }
    );
  };

  const formattedTime = (() => {
    try {
      const d = new Date(message.createdAt);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  })();

  const references = message.references || message.structuredResponse?.references || [];
  const confidenceNote = message.confidenceNote || message.structuredResponse?.confidenceNote;
  const disclaimer = message.disclaimer || message.structuredResponse?.disclaimer;
  const explanationType = message.explanationType || message.structuredResponse?.explanationType;

  return (
    <div className={`flex gap-3 sm:gap-4 ${isAssistant ? "justify-start" : "justify-end"} group animate-in fade-in duration-200`}>
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-0.5 shrink-0 shadow-md shadow-blue-600/20 flex items-center justify-center mt-1">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Brain className="w-4 h-4 text-blue-400" />
          </div>
        </div>
      )}

      {/* Message Body Container */}
      <div className={`max-w-[88%] sm:max-w-[80%] flex flex-col ${isAssistant ? "items-start" : "items-end"}`}>
        {/* Header meta */}
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <span className="text-xs font-bold text-slate-300">
            {isAssistant ? "🧠 SentimentAI Assistant" : (user?.name || "You")}
          </span>
          {isAssistant && explanationType && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wider">
              {explanationType === "simple" ? "💡 Simple Mode" : explanationType === "detailed" ? "📊 Detailed Mode" : "💡 Clarification"}
            </span>
          )}
          {formattedTime && (
            <span className="text-[11px] text-slate-500">{formattedTime}</span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-3xl p-4 sm:p-5 text-sm leading-relaxed shadow-lg ${
            isAssistant
              ? "bg-slate-900/90 border border-slate-800 text-slate-200 backdrop-blur-md"
              : "bg-blue-600 border border-blue-500 text-white shadow-blue-600/20"
          }`}
        >
          {isAssistant ? (
            <div className="space-y-4">
              {/* Markdown Content */}
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-bold prose-headings:text-base prose-p:leading-relaxed prose-p:text-slate-200 prose-li:text-slate-200 prose-strong:text-blue-300 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-950/20 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r-xl">
                <Markdown>{message.content}</Markdown>
              </div>

              {/* Referenced Sections */}
              {references && references.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-2">
                    <Tag className="w-3 h-3 text-blue-400" />
                    <span>Referenced Analysis Points:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {references.map((ref, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSectionClick?.(ref.section)}
                        className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-[11px] font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>•</span>
                        <span>{ref.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence Note */}
              {confidenceNote && (
                <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-200">Confidence Note: </span>
                    <span>{confidenceNote}</span>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              {disclaimer && (
                <div className="pt-2 text-[11px] text-slate-500 italic flex items-center gap-1.5 border-t border-slate-800/60">
                  <ShieldCheck className="w-3 h-3 text-slate-600 shrink-0" />
                  <span>{disclaimer}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Action Toolbar for Assistant Response */}
        {isAssistant && (
          <div className="flex items-center gap-2 mt-2 px-1">
            {/* Audio TTS Button */}
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                isPlaying && !isPaused
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                  : isPaused
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              title="Listen to this explanation"
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Voice</span>
                </>
              ) : isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Listen</span>
                </>
              )}
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copy explanation"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {!isAssistant && (
        <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400 font-bold text-xs mt-1">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
        </div>
      )}
    </div>
  );
}
