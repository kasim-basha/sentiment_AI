import React, { useState } from "react";
import {
  FileText,
  Trash2,
  Download,
  ExternalLink,
  Check,
  Loader2,
  Share2
} from "lucide-react";
import { ReportRecord } from "../../types";

interface ReportCardProps {
  key?: string;
  report: ReportRecord;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onView: (reportId: string) => void;
  onDownloadPDF: (reportId: string) => Promise<void>;
  onExportTXT: (reportId: string) => Promise<void>;
  onShare?: (report: ReportRecord) => void;
  onDelete: (report: ReportRecord) => void;
}

export function ReportCard({
  report,
  isSelected,
  onToggleSelect,
  onView,
  onDownloadPDF,
  onExportTXT,
  onShare,
  onDelete
}: ReportCardProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingTXT, setIsExportingTXT] = useState(false);

  // Format Date and Time
  const formattedDateTime = (() => {
    try {
      const d = new Date(report.createdAt);
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
      return report.createdAt;
    }
  })();

  // Input types formatting
  const inputTypes = report.inputTypes || ["text"];
  const isMixed = inputTypes.length > 1;
  const hasText = inputTypes.includes("text");
  const hasImage = inputTypes.includes("image");
  const hasVideo = inputTypes.includes("video");

  const primaryBadge = (() => {
    if (isMixed) return { emoji: "🔀", label: "Mixed Modalities" };
    if (hasVideo) return { emoji: "🎥", label: "Video Session" };
    if (hasImage) return { emoji: "🖼️", label: "Image Content" };
    return { emoji: "📝", label: "Text Analysis" };
  })();

  // Detailed breakdown string
  const breakdownParts: string[] = [];
  if (report.inputSummary.textCount > 0) {
    breakdownParts.push(`📝 ${report.inputSummary.textCount} Text`);
  }
  if (report.inputSummary.imageCount > 0) {
    breakdownParts.push(`🖼️ ${report.inputSummary.imageCount} Image${report.inputSummary.imageCount > 1 ? "s" : ""}`);
  }
  if (report.inputSummary.videoCount > 0) {
    breakdownParts.push(`🎥 ${report.inputSummary.videoCount} Video${report.inputSummary.videoCount > 1 ? "s" : ""}`);
  }
  const breakdownString = breakdownParts.length > 0
    ? breakdownParts.join(" • ")
    : `Total Sources: ${report.inputSummary.totalFiles}`;

  // Sentiment styling
  const sentiment = report.overallSentiment.label;
  const sentimentStyles = (() => {
    switch (sentiment) {
      case "Positive":
        return {
          emoji: "😊",
          text: "Positive",
          classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
        };
      case "Negative":
        return {
          emoji: "😞",
          text: "Negative",
          classes: "bg-rose-500/10 border-rose-500/30 text-rose-300"
        };
      case "Mixed":
        return {
          emoji: "🔀",
          text: "Mixed",
          classes: "bg-violet-500/10 border-violet-500/30 text-violet-300"
        };
      default:
        return {
          emoji: "😐",
          text: "Neutral",
          classes: "bg-slate-500/10 border-slate-500/30 text-slate-300"
        };
    }
  })();

  const handlePDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingPDF(true);
    try {
      await onDownloadPDF(report.reportId);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleTXT = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingTXT(true);
    try {
      await onExportTXT(report.reportId);
    } finally {
      setIsExportingTXT(false);
    }
  };

  return (
    <div
      className={`group relative rounded-2xl p-5 sm:p-6 transition-all border backdrop-blur-md flex flex-col justify-between ${
        isSelected
          ? "bg-slate-900/90 border-blue-500/50 shadow-xl shadow-blue-500/10"
          : "bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700/80"
      }`}
    >
      <div>
        {/* Top Bar: Checkbox, Icon, Title, Date */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => onToggleSelect(report.reportId)}
              className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "border-slate-700 hover:border-slate-500 bg-slate-950"
              }`}
              aria-label={isSelected ? "Deselect report" : "Select report"}
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            {/* Report Icon */}
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>

            {/* Title & Input Types */}
            <div className="min-w-0 flex-1">
              <h2
                onClick={() => onView(report.reportId)}
                className="text-base sm:text-lg font-bold text-white group-hover:text-blue-300 transition-colors truncate cursor-pointer"
                title={report.title}
              >
                {report.title}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">{primaryBadge.emoji} {primaryBadge.label}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{breakdownString}</span>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap text-right shrink-0">
            {formattedDateTime}
          </div>
        </div>

        {/* Signals & Badges Row */}
        <div className="flex flex-wrap items-center gap-2 my-3.5">
          {/* Sentiment Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sentimentStyles.classes}`}>
            <span>{sentimentStyles.emoji}</span>
            <span>{sentimentStyles.text}</span>
            <span className="opacity-75 text-[10px]">({Math.round(report.overallSentiment.score * 100)}%)</span>
          </span>

          {/* Dominant Emotion Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
            <span>🎭</span>
            <span>Dominant Emotion: <strong className="text-white">{report.dominantEmotion}</strong></span>
          </span>

          {/* Confidence Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span className="text-blue-400">🎯</span>
            <span>{report.overallSentiment.confidence} Confidence</span>
          </span>
        </div>

        {/* Short Summary Section */}
        <div className="my-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed italic line-clamp-2">
          "{report.summary}"
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="pt-4 mt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* View Button */}
          <button
            type="button"
            onClick={() => onView(report.reportId)}
            className="px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <span>👁️ View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* PDF Download Button */}
          <button
            type="button"
            onClick={handlePDF}
            disabled={isExportingPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            title="Download PDF report"
          >
            {isExportingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>⬇️ PDF</span>
          </button>

          {/* TXT Export Button */}
          <button
            type="button"
            onClick={handleTXT}
            disabled={isExportingTXT}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            title="Export plain text report"
          >
            {isExportingTXT ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>⬇️ TXT</span>
          </button>

          {/* Share Button */}
          {onShare && (
            <button
              type="button"
              onClick={() => onShare(report)}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-emerald-600/20 border border-slate-700/80 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Share report to WhatsApp, Facebook, Instagram, YouTube, X, and more"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(report)}
          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          title="Delete report"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>🗑️ Delete</span>
        </button>
      </div>
    </div>
  );
}
