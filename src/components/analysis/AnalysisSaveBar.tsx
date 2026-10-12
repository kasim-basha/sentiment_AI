import React, { useState } from "react";
import {
  BookmarkCheck,
  Save,
  Check,
  FileText,
  ExternalLink,
  Download,
  Copy,
  Clock,
  Sparkles,
  FileCode,
  Eye,
  Share2,
  Globe,
  Brain
} from "lucide-react";
import { MultimodalAnalysisResult } from "../../types";
import { analysisSessionService } from "../../services/analysisSessionService";
import { reportService } from "../../services/reportService";

interface AnalysisSaveBarProps {
  result: MultimodalAnalysisResult;
  isSaved?: boolean;
  onOpenSaveModal: () => void;
  onViewSavedFile?: (analysisId: string) => void;
  onViewReport?: (analysisId: string) => void;
  onShare?: () => void;
  onShareToCommunity?: () => void;
  onOpenClarityAssistant?: (initialQuestion?: string, mode?: "simple" | "detailed", section?: string) => void;
}

export function AnalysisSaveBar({
  result,
  isSaved = true,
  onOpenSaveModal,
  onViewSavedFile,
  onViewReport,
  onShare,
  onShareToCommunity,
  onOpenClarityAssistant
}: AnalysisSaveBarProps) {
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(result.analysis_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy ID:", e);
    }
  };

  const handleDownloadJSON = () => {
    analysisSessionService.downloadAnalysisAsJSON({
      result,
      title: result.meaning?.split(".")[0]?.slice(0, 45) || "sentiment_analysis"
    });
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      await reportService.generatePDF(result.analysis_id);
    } catch (e) {
      console.error("Failed to generate PDF:", e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Left: Saved Status Badge & File Details */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
          <BookmarkCheck className="w-4 h-4" />
          <span>{isSaved ? "Saved to Library & Reports" : "Analysis Ready"}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-500">File ID:</span>
          <span className="text-blue-300 font-semibold">{result.analysis_id}</span>
          <button
            type="button"
            onClick={handleCopyId}
            className="ml-1 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer p-0.5"
            title="Copy Analysis ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Step 19: AI Clarity Assistant Button */}
        {onOpenClarityAssistant && (
          <button
            type="button"
            onClick={() => onOpenClarityAssistant()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/25 via-indigo-600/25 to-purple-600/25 hover:from-blue-600/35 hover:to-purple-600/35 border border-blue-500/40 hover:border-blue-400 text-blue-200 hover:text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-blue-600/20"
            title="Ask SentimentAI Assistant to explain or clarify this analysis"
          >
            <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>🧠 Ask AI for Clarity</span>
          </button>
        )}

        {/* Save Analysis / Edit Title Button */}
        <button
          type="button"
          onClick={onOpenSaveModal}
          className="px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Save or rename this analysis record"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Analysis</span>
        </button>

        {/* Share Button (WhatsApp, FB, Insta, YouTube, etc.) */}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Share analysis to WhatsApp, Facebook, Instagram, YouTube, X, LinkedIn, and more"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Share</span>
          </button>
        )}

        {/* Share to Community Button */}
        {onShareToCommunity && (
          <button
            type="button"
            onClick={onShareToCommunity}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
            title="Share this analysis to the SentimentAI Community"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>🌐 Share Analysis</span>
          </button>
        )}

        {/* View Saved File (History detail view) */}
        {onViewSavedFile && (
          <button
            type="button"
            onClick={() => onViewSavedFile(result.analysis_id)}
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
            title="Open saved record to inspect all file details and history"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>View Saved File</span>
          </button>
        )}

        {/* View Report */}
        {onViewReport && (
          <button
            type="button"
            onClick={() => onViewReport(result.analysis_id)}
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
            title="Open the official formatted executive report"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Report</span>
          </button>
        )}

        {/* Download JSON file */}
        <button
          type="button"
          onClick={handleDownloadJSON}
          className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          title="Download raw analysis file (.json)"
        >
          <FileCode className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">JSON</span>
        </button>

        {/* Download PDF */}
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isExportingPDF}
          className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Download printable PDF Report"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">{isExportingPDF ? "Exporting..." : "PDF"}</span>
        </button>
      </div>
    </div>
  );
}
