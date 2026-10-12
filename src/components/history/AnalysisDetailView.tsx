import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Trash2,
  Copy,
  Check,
  Calendar,
  Clock,
  Share2,
  FileText,
  Brain,
  Download,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileCode,
  Loader2,
  Globe
} from "lucide-react";
import { AnalysisResults } from "../analysis/AnalysisResults";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { DashboardNavbar } from "../dashboard/DashboardNavbar";
import { User, ViewState, HistoryRecord, MultimodalAnalysisResult } from "../../types";
import { analysisSessionService } from "../../services/analysisSessionService";
import { reportService } from "../../services/reportService";
import { ShareModal } from "../share/ShareModal";
import { shareService } from "../../services/shareService";
import { ShareAnalysisDialog } from "../community/ShareAnalysisDialog";
import { ClarityAssistantModal } from "../clarity/ClarityAssistantModal";
import { Sparkles } from "lucide-react";

interface AnalysisDetailViewProps {
  analysisId: string;
  user: User;
  onLogout: () => void;
  onNavigate: (view: ViewState) => void;
  onViewReport?: (reportId: string) => void;
  onBackToHistory: () => void;
}

export function AnalysisDetailView({
  analysisId,
  user,
  onLogout,
  onNavigate,
  onViewReport,
  onBackToHistory
}: AnalysisDetailViewProps) {
  const [record, setRecord] = useState<HistoryRecord | null>(null);
  const [result, setResult] = useState<MultimodalAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommunityShareOpen, setIsCommunityShareOpen] = useState(false);
  const [isClarityAssistantOpen, setIsClarityAssistantOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalysis() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await analysisSessionService.getAnalysisSession(analysisId);
        if (!isMounted) return;

        if (data) {
          setRecord(data.record);
          setResult(data.result);
        } else {
          setError("Analysis session not found. It may have been deleted.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load analysis session details.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAnalysis();
    return () => {
      isMounted = false;
    };
  }, [analysisId]);

  const handleCopySummary = async () => {
    if (!result) return;
    const summaryText = `
SENTIMENTAI ANALYSIS REPORT
Title: ${record?.title || "Multimodal Analysis"}
ID: ${analysisId}
Date: ${record?.createdAt ? new Date(record.createdAt).toLocaleString() : new Date().toLocaleString()}

Overall Sentiment: ${result.overall_sentiment.label} (${result.overall_sentiment.intensity} Intensity) - Confidence: ${result.overall_sentiment.confidence}
Dominant Emotion: ${result.emotions.dominant.name} (${result.emotions.dominant.intensity})

Summary:
${result.tts_summary || result.meaning}

Key Insights:
${result.key_insights.map(i => `• ${i}`).join('\n')}
    `.trim();

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy summary:", err);
    }
  };

  const handleDownloadJSON = () => {
    if (!result) return;
    analysisSessionService.downloadAnalysisAsJSON({
      result,
      title: record?.title || "sentiment_analysis"
    });
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      await reportService.generatePDF(analysisId);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await analysisSessionService.deleteAnalysisSession(analysisId);
      setIsDeleteModalOpen(false);
      onBackToHistory();
    } catch (err) {
      console.error("Failed to delete analysis session:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
        <DashboardNavbar
          user={user}
          onLogout={onLogout}
          onNavigate={onNavigate}
          currentView="history"
        />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-800 rounded-xl" />
            <div className="h-16 w-full bg-slate-800/80 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-56 bg-slate-800/60 rounded-3xl" />
              <div className="h-56 bg-slate-800/60 rounded-3xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
        <DashboardNavbar
          user={user}
          onLogout={onLogout}
          onNavigate={onNavigate}
          currentView="history"
        />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Analysis Session Not Found</h2>
          <p className="text-slate-400 mb-8 max-w-md text-sm">
            {error || "We could not find this analysis record. It may have been removed or deleted."}
          </p>
          <button
            type="button"
            onClick={onBackToHistory}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to History</span>
          </button>
        </main>
      </div>
    );
  }

  // Format created date
  const formattedDate = record?.createdAt
    ? new Date(record.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
    : "Recent";

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-24 flex flex-col">
      <DashboardNavbar
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentView="history"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 flex-1 w-full">
        {/* Navigation & Header Toolbar */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <button
            type="button"
            onClick={onBackToHistory}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>← Back to Analysis History</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Step 19: Ask AI for Clarity Button */}
            <button
              type="button"
              onClick={() => setIsClarityAssistantOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/25 via-indigo-600/25 to-purple-600/25 hover:from-blue-600/35 hover:to-purple-600/35 border border-blue-500/40 hover:border-blue-400 text-blue-200 hover:text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              title="Ask SentimentAI Assistant to explain or clarify this historical analysis"
            >
              <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
              <span>🧠 Ask AI for Clarity</span>
            </button>

            {/* View Official Report Button */}
            {onViewReport && (
              <button
                type="button"
                onClick={() => onViewReport(analysisId)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
                title="View formatted executive report"
              >
                <FileText className="w-4 h-4 text-white" />
                <span>View Official Report</span>
              </button>
            )}

            {/* Share Button (WhatsApp, FB, Insta, YouTube, etc.) */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Share this analysis to WhatsApp, Facebook, Instagram, YouTube, and more"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Share</span>
            </button>

            {/* Share to Community Button */}
            <button
              type="button"
              onClick={() => setIsCommunityShareOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Share this analysis to SentimentAI Community"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>🌐 Share to Community</span>
            </button>

            {/* Download JSON Button */}
            <button
              type="button"
              onClick={handleDownloadJSON}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              title="Download saved analysis as JSON file"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              <span>Download JSON</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              title="Download analysis PDF report"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isExportingPDF ? "Exporting..." : "Export PDF"}</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-2"
              title="Copy analysis summary to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? "Copied!" : "Copy Summary"}</span>
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              title="Delete this analysis record"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Previous Analysis Session Metadata Banner */}
        <div className="mb-10 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                Saved File Record
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ID: {analysisId}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {record?.title || "Multimodal Analysis Result"}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Saved on {formattedDate}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("my-analysis")}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Brain className="w-4 h-4" />
              <span>New Analysis</span>
            </button>
          </div>
        </div>

        {/* Render Analysis Results */}
        <AnalysisResults
          result={result}
          onNavigate={onNavigate}
          onNewAnalysis={() => onNavigate("my-analysis")}
          onCopy={handleCopySummary}
          userId={user.id}
          user={user}
          isSaved={true}
          onViewSavedFile={() => {}}
          onViewReport={onViewReport}
        />
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete this analysis?"
        itemTitle={record?.title}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Step 19: GenAI Clarity Assistant Modal */}
      {result && (
        <ClarityAssistantModal
          isOpen={isClarityAssistantOpen}
          onClose={() => setIsClarityAssistantOpen(false)}
          analysisId={result.analysis_id}
          analysisTitle={record?.title || result.meaning?.split(".")[0]?.slice(0, 50)}
          analysisResult={result}
          user={user}
        />
      )}

      {/* Social & Multimodal Share Modal */}
      {(result || record) && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          data={
            result
              ? shareService.fromAnalysisResult(result, record?.title)
              : shareService.fromHistoryRecord(record!)
          }
        />
      )}

      {/* SentimentAI Community Share Dialog */}
      {result && (
        <ShareAnalysisDialog
          isOpen={isCommunityShareOpen}
          onClose={() => setIsCommunityShareOpen(false)}
          analysisId={result.analysis_id}
          defaultTitle={record?.title || result.meaning?.split(".")[0]?.slice(0, 80) || "Multimodal Sentiment Analysis"}
          defaultDescription={result.tts_summary || "Key insights, tone dynamics, and emotional trajectory discovered in this session."}
          user={user}
          onSharedSuccess={() => {
            // Callback
          }}
        />
      )}
    </div>
  );
}
