import React, { useState } from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Trash2,
  Clock,
  Share2,
  Check,
  Brain,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { ReportRecord, MultimodalAnalysisResult, ViewState } from "../../types";
import { SentimentAILogo } from "../SentimentAILogo";
import { AnalysisResults } from "../analysis/AnalysisResults";
import { ShareModal } from "../share/ShareModal";
import { shareService } from "../../services/shareService";
import { ClarityAssistantModal } from "../clarity/ClarityAssistantModal";
import { Copy, Sparkles } from "lucide-react";

interface ReportViewerProps {
  report: ReportRecord;
  onBack: () => void;
  onNavigate: (view: ViewState) => void;
  onDownloadPDF: (reportId: string) => Promise<void>;
  onExportTXT: (reportId: string) => Promise<void>;
  onDelete: (report: ReportRecord) => void;
}

export function ReportViewer({
  report,
  onBack,
  onNavigate,
  onDownloadPDF,
  onExportTXT,
  onDelete
}: ReportViewerProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingTXT, setIsExportingTXT] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isClarityAssistantOpen, setIsClarityAssistantOpen] = useState(false);

  // Format date
  const formattedDate = (() => {
    try {
      const d = new Date(report.createdAt);
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return report.createdAt;
    }
  })();

  const handlePDF = async () => {
    setIsExportingPDF(true);
    try {
      await onDownloadPDF(report.reportId);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleTXT = async () => {
    setIsExportingTXT(true);
    try {
      await onExportTXT(report.reportId);
    } finally {
      setIsExportingTXT(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = `
SENTIMENTAI ANALYSIS REPORT
Title: ${report.title}
Date: ${formattedDate}
ID: ${report.analysisId}
Overall Sentiment: ${report.overallSentiment.label} (${(report.overallSentiment.score * 100).toFixed(0)}%) - ${report.overallSentiment.confidence} Confidence
Dominant Emotion: ${report.dominantEmotion}
Summary: ${report.summary}
    `.trim();

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Reconstruct or use fullResult
  const analysisResult: MultimodalAnalysisResult = report.fullResult || {
    analysis_id: report.analysisId,
    created_at: new Date(report.createdAt).getTime(),
    language: "English",
    input_summary: {
      text_count: report.inputSummary.textCount,
      image_count: report.inputSummary.imageCount,
      video_count: report.inputSummary.videoCount,
      total_files: report.inputSummary.totalFiles,
      has_direct_text: report.inputSummary.textCount > 0
    },
    overall_sentiment: {
      label: report.overallSentiment.label,
      intensity: "High",
      confidence: report.overallSentiment.confidence,
      score: report.overallSentiment.score
    },
    emotions: {
      dominant: {
        name: report.dominantEmotion,
        intensity: "High",
        reason: "Primary emotional driver detected across analyzed signals."
      },
      secondary: (report.secondaryEmotions || []).map(name => ({
        name,
        intensity: "Medium",
        reason: "Secondary emotional nuance detected."
      }))
    },
    meaning: report.summary,
    emotional_context: "Synthesized from user input modalities and affective linguistic markers.",
    key_insights: [report.summary],
    positive_signals: report.overallSentiment.label === "Positive" ? ["Consistent positive expressions recorded."] : [],
    concerns: report.overallSentiment.label === "Negative" ? ["Elevated friction signals observed."] : [],
    tts_summary: report.summary
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>← Back to Reports</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Step 19: AI Clarity Assistant Button */}
          <button
            type="button"
            onClick={() => setIsClarityAssistantOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600/25 via-indigo-600/25 to-purple-600/25 hover:from-blue-600/35 hover:to-purple-600/35 border border-blue-500/40 hover:border-blue-400 text-blue-200 hover:text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            title="Ask SentimentAI Assistant to explain this report in simple language"
          >
            <Brain className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>🧠 Explain with AI</span>
          </button>

          {/* Generate PDF Button */}
          <button
            type="button"
            onClick={handlePDF}
            disabled={isExportingPDF}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isExportingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>📄 Generate PDF Report</span>
          </button>

          {/* Export TXT Button */}
          <button
            type="button"
            onClick={handleTXT}
            disabled={isExportingTXT}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isExportingTXT ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>📝 Export TXT</span>
          </button>

          {/* Share Report (WhatsApp, Facebook, Instagram, YouTube, etc.) */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Share report to WhatsApp, Facebook, Instagram, YouTube, X, LinkedIn, and more"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Share Report</span>
          </button>

          {/* Copy Report */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            title="Copy report text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "Copied!" : "Copy Text"}</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(report)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Delete report"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* 📄 Report Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <SentimentAILogo className="w-8 h-8" />
              <span className="text-xl font-bold text-white tracking-tight">SentimentAI</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                Official Report
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              {report.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{formattedDate}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-500">ID: {report.analysisId}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Analysis</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => onNavigate("my-analysis")}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Brain className="w-4 h-4" />
              <span>🧠 New Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Step 7 Analysis Results Component */}
      <AnalysisResults
        result={analysisResult}
        onNavigate={onNavigate}
        onNewAnalysis={() => onNavigate("my-analysis")}
        onCopy={handleCopy}
      />

      {/* Social & Multimodal Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={shareService.fromReportRecord(report)}
      />

      {/* Step 19: GenAI Clarity Assistant Modal */}
      <ClarityAssistantModal
        isOpen={isClarityAssistantOpen}
        onClose={() => setIsClarityAssistantOpen(false)}
        analysisId={report.analysisId}
        analysisTitle={report.title}
        analysisResult={analysisResult}
      />
    </div>
  );
}
