import React from "react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Brain,
  Trash2,
  FileCheck,
  Clock,
  Check,
  ExternalLink,
  Target,
  Share2
} from "lucide-react";
import { HistoryRecord } from "../../types";

interface HistoryCardProps {
  key?: string;
  record: HistoryRecord;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onView: (id: string) => void;
  onViewReport?: (id: string) => void;
  onShare?: (record: HistoryRecord) => void;
  onDelete: (record: HistoryRecord) => void;
}

export function HistoryCard({
  record,
  isSelected,
  onToggleSelect,
  onView,
  onViewReport,
  onShare,
  onDelete
}: HistoryCardProps) {
  // Format Date & Time: "Sep 9, 2026 • 10:35 AM"
  const formattedDateTime = (() => {
    try {
      const d = new Date(record.createdAt);
      const datePart = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const timePart = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      return `${datePart} • ${timePart}`;
    } catch {
      return record.createdAt;
    }
  })();

  // Determine Primary Icon & Input Type Display
  const isMixed = record.inputTypes.length > 1;
  const hasText = record.inputTypes.includes("text");
  const hasImage = record.inputTypes.includes("image");
  const hasVideo = record.inputTypes.includes("video");

  const getPrimaryEmoji = () => {
    if (isMixed) return "🔀";
    if (hasVideo) return "🎥";
    if (hasImage) return "🖼️";
    return "📝";
  };

  // Sentiment Visual Styles
  const getSentimentBadge = () => {
    const label = record.overallSentiment.label;
    switch (label) {
      case "Positive":
        return {
          emoji: "😊",
          text: "Positive",
          classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        };
      case "Negative":
        return {
          emoji: "😞",
          text: "Negative",
          classes: "bg-rose-500/10 border-rose-500/30 text-rose-400"
        };
      case "Neutral":
        return {
          emoji: "😐",
          text: "Neutral",
          classes: "bg-slate-500/15 border-slate-500/30 text-slate-300"
        };
      case "Mixed":
        return {
          emoji: "🔀",
          text: "Mixed",
          classes: "bg-violet-500/10 border-violet-500/30 text-violet-400"
        };
      default:
        return {
          emoji: "📊",
          text: label,
          classes: "bg-blue-500/10 border-blue-500/30 text-blue-400"
        };
    }
  };

  const sentimentBadge = getSentimentBadge();

  // Input Type breakdown details
  const renderInputBreakdown = () => {
    if (!isMixed) {
      if (hasVideo) {
        return (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>🎥 Video</span>
            <span>•</span>
            <span>{record.inputSummary.totalFiles || 1} file</span>
          </span>
        );
      }
      if (hasImage) {
        return (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>🖼️ Image</span>
            <span>•</span>
            <span>{record.inputSummary.imageCount || record.inputSummary.totalFiles} {record.inputSummary.totalFiles === 1 ? 'file' : 'files'}</span>
          </span>
        );
      }
      return (
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>📝 Text</span>
          <span>•</span>
          <span>{record.inputSummary.textCount || 1} input</span>
        </span>
      );
    }

    // Mixed Content Breakdown: e.g. "📝 1 Text • 🖼️ 2 Images • 🎥 1 Video"
    const parts: string[] = [];
    if (record.inputSummary.textCount > 0) {
      parts.push(`📝 ${record.inputSummary.textCount} Text`);
    }
    if (record.inputSummary.imageCount > 0) {
      parts.push(`🖼️ ${record.inputSummary.imageCount} Image${record.inputSummary.imageCount > 1 ? 's' : ''}`);
    }
    if (record.inputSummary.videoCount > 0) {
      parts.push(`🎥 ${record.inputSummary.videoCount} Video${record.inputSummary.videoCount > 1 ? 's' : ''}`);
    }

    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-violet-300">🔀 Mixed:</span>
        <span>{parts.join(" • ") || `${record.inputSummary.totalFiles} inputs`}</span>
      </div>
    );
  };

  return (
    <div
      id={`history-card-${record.analysisId}`}
      className={`group relative rounded-3xl border transition-all duration-200 bg-slate-900/70 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between ${
        isSelected
          ? "border-blue-500 bg-blue-950/20 ring-2 ring-blue-500/20 shadow-xl shadow-blue-950/30"
          : "border-slate-800/80 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40"
      }`}
    >
      {/* Top row: Checkbox, Title & Type Icon */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Multi-select checkbox */}
            <div className="pt-0.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => onToggleSelect(record.analysisId)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "border-slate-700 bg-slate-950/60 hover:border-slate-500 text-transparent"
                }`}
                title={isSelected ? "Deselect analysis" : "Select analysis"}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            {/* Icon & Title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl shrink-0 select-none" aria-hidden="true">
                  {getPrimaryEmoji()}
                </span>
                <h3
                  onClick={() => onView(record.analysisId)}
                  className="text-base sm:text-lg font-bold text-white group-hover:text-blue-300 transition-colors truncate cursor-pointer"
                  title={record.title}
                >
                  {record.title}
                </h3>
              </div>

              {/* Input Types & File Count */}
              <div className="mt-1">
                {renderInputBreakdown()}
              </div>
            </div>
          </div>

          {/* Date & Time Timestamp */}
          <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap text-right shrink-0">
            {formattedDateTime}
          </div>
        </div>

        {/* Signals & Badges Row: Sentiment, Emotion, Confidence */}
        <div className="flex flex-wrap items-center gap-2 my-3.5 pt-1">
          {/* Sentiment Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sentimentBadge.classes}`}>
            <span>{sentimentBadge.emoji}</span>
            <span>{sentimentBadge.text}</span>
          </span>

          {/* Dominant Emotion Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/25 text-indigo-300">
            <span>🎭</span>
            <span>{record.dominantEmotion}</span>
          </span>

          {/* Confidence Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span className="text-blue-400">🎯</span>
            <span>{record.overallSentiment.confidence} Confidence</span>
          </span>
        </div>

        {/* Short Summary Section */}
        <div className="my-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed italic line-clamp-2">
          "{record.summary}"
        </div>

        {/* Attached files hint if present */}
        {record.fileNames && record.fileNames.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2 truncate">
            <span className="text-slate-400 font-semibold">Files:</span>
            <span className="truncate">{record.fileNames.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Bottom Actions Row: View Analysis, Report & Delete */}
      <div className="pt-4 mt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView(record.analysisId)}
            className="px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>View Analysis</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {onViewReport ? (
            <button
              type="button"
              onClick={() => onViewReport(record.analysisId)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              title="View Official Report & Export"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>📄 Report</span>
            </button>
          ) : (
            <a
              href={`#reports/${record.analysisId}`}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              title="View Official Report & Export"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>📄 Report</span>
            </a>
          )}

          {onShare && (
            <button
              type="button"
              onClick={() => onShare(record)}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-emerald-600/20 border border-slate-700/80 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              title="Share to WhatsApp, Facebook, Instagram, YouTube, X, and more"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(record)}
          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          title="Delete this analysis"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
