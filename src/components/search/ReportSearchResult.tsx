import React from "react";
import { SearchReportResult } from "../../types";
import { FileText, Calendar, ArrowRight, Download, ShieldCheck } from "lucide-react";

interface ReportSearchResultProps {
  report: SearchReportResult;
  onViewReport: (reportId: string) => void;
}

export const ReportSearchResult: React.FC<ReportSearchResultProps> = ({
  report,
  onViewReport
}) => {
  const formattedDate = new Date(report.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div
      onClick={() => onViewReport(report.reportId)}
      className="p-4 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all group cursor-pointer shadow-sm relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 group-hover:border-blue-500/40 transition-colors">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
              {report.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="font-mono text-slate-400 text-[11px]">{report.fileType}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3" /> {formattedDate}
              </span>
            </div>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Certified Report
        </span>
      </div>

      {report.summary && (
        <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
          {report.summary}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
        <div className="text-slate-400 text-xs">
          Ref: <span className="font-mono text-slate-300">{report.analysisId}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-blue-400 transition-colors font-semibold">
          <span>Open Report</span>
          <ArrowRight className="w-3.5 h-3.5 -translate-x-0.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
