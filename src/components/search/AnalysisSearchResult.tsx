import React from "react";
import { SearchAnalysisResult } from "../../types";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Layers,
  Sparkles,
  Calendar,
  ArrowRight,
  TrendingUp,
  Brain
} from "lucide-react";

interface AnalysisSearchResultProps {
  analysis: SearchAnalysisResult;
  onViewAnalysis: (analysisId: string) => void;
}

export const AnalysisSearchResult: React.FC<AnalysisSearchResultProps> = ({
  analysis,
  onViewAnalysis
}) => {
  const getInputIcon = () => {
    switch (analysis.inputType) {
      case "image":
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case "video":
        return <Video className="w-4 h-4 text-rose-400" />;
      case "multimodal":
        return <Layers className="w-4 h-4 text-purple-400" />;
      case "text":
      default:
        return <FileText className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSentimentBadge = () => {
    const s = analysis.sentiment?.toLowerCase() || "neutral";
    if (s.includes("pos")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Positive ({Math.round(analysis.sentimentScore * 100)}%)
        </span>
      );
    }
    if (s.includes("neg")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Negative ({Math.round(analysis.sentimentScore * 100)}%)
        </span>
      );
    }
    if (s.includes("mix")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Mixed ({Math.round(analysis.sentimentScore * 100)}%)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/40 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Neutral ({Math.round(analysis.sentimentScore * 100)}%)
      </span>
    );
  };

  const formattedDate = new Date(analysis.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div
      onClick={() => onViewAnalysis(analysis.analysisId)}
      className="p-4 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition-all group cursor-pointer shadow-sm relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 group-hover:border-indigo-500/40 transition-colors">
            {getInputIcon()}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
              {analysis.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="capitalize text-slate-400">{analysis.inputType} assessment</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3" /> {formattedDate}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {getSentimentBadge()}
        </div>
      </div>

      {analysis.meaning && (
        <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
          {analysis.meaning}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
          <Brain className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dominant: {analysis.dominantEmotion}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-indigo-400 transition-colors font-semibold">
          <span>View Analysis</span>
          <ArrowRight className="w-3.5 h-3.5 -translate-x-0.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
