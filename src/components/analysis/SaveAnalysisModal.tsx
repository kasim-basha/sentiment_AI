import React, { useState } from "react";
import {
  X,
  Save,
  Check,
  FileText,
  Download,
  ExternalLink,
  History,
  Sparkles,
  Copy
} from "lucide-react";
import { MultimodalAnalysisResult, HistoryRecord } from "../../types";
import { analysisSessionService } from "../../services/analysisSessionService";
import { reportService } from "../../services/reportService";

interface SaveAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: MultimodalAnalysisResult;
  userId: string;
  initialTitle?: string;
  onSaved?: (record: HistoryRecord) => void;
  onViewSavedFile?: (analysisId: string) => void;
  onViewReport?: (analysisId: string) => void;
}

export function SaveAnalysisModal({
  isOpen,
  onClose,
  result,
  userId,
  initialTitle,
  onSaved,
  onViewSavedFile,
  onViewReport
}: SaveAnalysisModalProps) {
  const [title, setTitle] = useState(initialTitle || result.meaning?.split(".")[0]?.slice(0, 45) || "Multimodal Sentiment Analysis");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const record = await analysisSessionService.createAnalysisSession({
        userId,
        title: title.trim() || "Multimodal Sentiment Analysis",
        result
      });
      setIsSaved(true);
      if (onSaved) onSaved(record);
    } catch (err) {
      console.error("Failed to save analysis:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadJSON = () => {
    analysisSessionService.downloadAnalysisAsJSON({
      result,
      title: title.trim() || "sentiment_analysis"
    });
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      await reportService.generatePDF(result.analysis_id);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(result.analysis_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.error("Failed to copy ID:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">Save Analysis File</h3>
            <p className="text-xs text-slate-400">Store this record in your History & Reports library</p>
          </div>
        </div>

        {/* File ID & Metadata Tag */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-500 font-mono">FILE ID:</span>
            <span className="font-mono text-blue-300 truncate">{result.analysis_id}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyId}
            className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedId ? "Copied" : "Copy ID"}</span>
          </button>
        </div>

        {/* Form to update title */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Record Title / File Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Customer Feedback & Review Analysis"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
            />
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-2 py-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Sentiment</span>
              <span className="font-bold text-white">{result.overall_sentiment.label}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Emotion</span>
              <span className="font-bold text-white">{result.emotions.dominant.name}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Confidence</span>
              <span className="font-bold text-white">{result.overall_sentiment.confidence}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Update Saved Title</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Direct Action Links to View Saved File or Report */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5">
          <p className="text-xs font-semibold text-slate-400">Jump to Saved View or Export:</p>

          <div className="grid grid-cols-2 gap-2">
            {onViewSavedFile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewSavedFile(result.analysis_id);
                }}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer text-left"
              >
                <History className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">View Saved File</span>
              </button>
            )}

            {onViewReport && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewReport(result.analysis_id);
                }}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer text-left"
              >
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">View in Reports</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadJSON}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download .JSON</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isExportingPDF ? "Generating..." : "Download PDF"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
