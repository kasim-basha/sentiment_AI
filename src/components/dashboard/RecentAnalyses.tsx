import { AnalysisRecord } from "../../types";
import { FileText, Image as ImageIcon, Video, ArrowRight, Brain } from "lucide-react";

interface RecentAnalysesProps {
  records: AnalysisRecord[];
  onViewAll: () => void;
  onViewAnalysis?: (id: string) => void;
}

export function RecentAnalyses({ records, onViewAll, onViewAnalysis }: RecentAnalysesProps) {
  const getIcon = (type: string) => {
    if (type.includes("Mixed") || (type.includes("Text") && type.includes("Image"))) return Brain;
    if (type.includes("Text")) return FileText;
    if (type.includes("Image")) return ImageIcon;
    if (type.includes("Video")) return Video;
    return Brain;
  };

  const getSentimentStyles = (sentiment: AnalysisRecord["sentiment"]) => {
    switch (sentiment) {
      case "Positive": return "text-emerald-400 bg-emerald-400/10";
      case "Negative": return "text-rose-400 bg-rose-400/10";
      case "Neutral": return "text-slate-400 bg-slate-400/10";
      case "Mixed": return "text-violet-400 bg-violet-400/10";
      default: return "text-slate-400 bg-slate-400/10";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Recent Analyses</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          View All <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-950/50 text-[10px] text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 font-bold">Analysis</th>
              <th className="px-6 py-3 font-bold">Type</th>
              <th className="px-6 py-3 font-bold">Sentiment</th>
              <th className="px-6 py-3 font-bold">Date</th>
              <th className="px-6 py-3 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {records.map((record) => {
              const Icon = getIcon(record.type);
              return (
                <tr
                  key={record.id}
                  className="group hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => onViewAnalysis ? onViewAnalysis(record.id) : onViewAll()}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {record.title}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Icon className="w-3.5 h-3.5" />
                      {record.type}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getSentimentStyles(record.sentiment)}`}>
                      {record.sentiment}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {record.date}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewAnalysis) {
                          onViewAnalysis(record.id);
                        } else {
                          onViewAll();
                        }
                      }}
                      className="text-xs font-medium text-slate-400 group-hover:text-blue-400 hover:text-white transition-colors cursor-pointer"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {records.length === 0 && (
        <div className="p-10 text-center flex flex-col items-center justify-center">
          <p className="text-slate-400 text-sm mb-2">No analyses recorded yet.</p>
          <p className="text-xs text-slate-500">Run an analysis in My Analysis to see live records here.</p>
        </div>
      )}
    </div>
  );
}
