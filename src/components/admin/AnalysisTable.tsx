import React from "react";
import {
  Eye,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Layers,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { HistoryRecord } from "../../types";

interface AnalysisTableProps {
  analyses: HistoryRecord[];
  onViewAnalysis: (analysisId: string) => void;
  onDeleteAnalysis?: (analysis: HistoryRecord) => void;
}

export function AnalysisTable({
  analyses,
  onViewAnalysis,
  onDeleteAnalysis
}: AnalysisTableProps) {
  if (analyses.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-medium">No analyses match your search criteria or filters.</p>
      </div>
    );
  }

  // Helper for Input Type badge with icons
  const renderInputType = (types?: string[]) => {
    if (!types || types.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          📝 Text
        </span>
      );
    }

    if (types.length > 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Layers className="w-3 h-3" />
          🔀 Mixed
        </span>
      );
    }

    const t = types[0].toLowerCase();
    if (t === "image") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <ImageIcon className="w-3 h-3" />
          🖼️ Image
        </span>
      );
    }
    if (t === "video") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <VideoIcon className="w-3 h-3" />
          🎥 Video
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <FileText className="w-3 h-3" />
        📝 Text
      </span>
    );
  };

  // Helper for Sentiment badge
  const renderSentiment = (sentimentLabel?: string) => {
    const label = sentimentLabel || "Neutral";
    const colors: Record<string, string> = {
      Positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      Negative: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      Neutral: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      Mixed: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${colors[label] || colors.Neutral}`}>
        {label}
      </span>
    );
  };

  // Helper for Status badge
  const renderStatus = (status?: string) => {
    const s = (status || "completed").toLowerCase();
    if (s === "processing") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
          <Clock className="w-3 h-3 animate-spin" />
          Processing
        </span>
      );
    }
    if (s === "failed") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
        <CheckCircle2 className="w-3 h-3" />
        Completed
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px]" aria-label="Analyses Table">
        <thead>
          <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th scope="col" className="px-5 py-3.5">Analysis ID</th>
            <th scope="col" className="px-5 py-3.5">User</th>
            <th scope="col" className="px-5 py-3.5">Title</th>
            <th scope="col" className="px-5 py-3.5">Input Type</th>
            <th scope="col" className="px-5 py-3.5">Sentiment</th>
            <th scope="col" className="px-5 py-3.5">Emotion</th>
            <th scope="col" className="px-5 py-3.5">Status</th>
            <th scope="col" className="px-5 py-3.5">Created Date</th>
            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-sm">
          {analyses.map((a) => (
            <tr key={a.analysisId} className="hover:bg-slate-800/30 transition-colors">
              {/* Analysis ID */}
              <td className="px-5 py-4 font-mono text-xs text-slate-400">
                {a.analysisId}
              </td>

              {/* User ID / Name */}
              <td className="px-5 py-4 text-xs font-medium text-slate-300">
                <span className="font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                  {a.userId || "user_default"}
                </span>
              </td>

              {/* Title */}
              <td className="px-5 py-4">
                <div className="font-semibold text-white truncate max-w-[200px]" title={a.title}>
                  {a.title || "Untitled Analysis"}
                </div>
              </td>

              {/* Input Type */}
              <td className="px-5 py-4">
                {renderInputType(a.inputTypes)}
              </td>

              {/* Sentiment */}
              <td className="px-5 py-4">
                {renderSentiment(a.overallSentiment?.label)}
              </td>

              {/* Emotion */}
              <td className="px-5 py-4 text-xs text-slate-300 font-medium">
                {a.dominantEmotion || "Neutral"}
              </td>

              {/* Status */}
              <td className="px-5 py-4">
                {renderStatus(a.status)}
              </td>

              {/* Created Date */}
              <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {a.createdAt ? new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                </div>
              </td>

              {/* Actions */}
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewAnalysis(a.analysisId)}
                    title="View analysis results"
                    aria-label={`View analysis results for ${a.title}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {onDeleteAnalysis && (
                    <button
                      onClick={() => onDeleteAnalysis(a)}
                      title="Delete analysis record"
                      aria-label={`Delete analysis ${a.title}`}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
