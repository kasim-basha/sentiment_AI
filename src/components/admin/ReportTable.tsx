import React from "react";
import {
  Eye,
  Trash2,
  Download,
  FileText,
  Calendar,
  AlertCircle
} from "lucide-react";
import { ReportRecord } from "../../types";

interface ReportTableProps {
  reports: ReportRecord[];
  onViewReport: (reportId: string) => void;
  onDownloadReport?: (report: ReportRecord) => void;
  onDeleteReport?: (report: ReportRecord) => void;
}

export function ReportTable({
  reports,
  onViewReport,
  onDownloadReport,
  onDeleteReport
}: ReportTableProps) {
  if (reports.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-medium">No reports found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]" aria-label="Reports Table">
        <thead>
          <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th scope="col" className="px-5 py-3.5">Report ID</th>
            <th scope="col" className="px-5 py-3.5">Analysis</th>
            <th scope="col" className="px-5 py-3.5">User</th>
            <th scope="col" className="px-5 py-3.5">Format</th>
            <th scope="col" className="px-5 py-3.5">Created Date</th>
            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-sm">
          {reports.map((r) => (
            <tr key={r.reportId} className="hover:bg-slate-800/30 transition-colors">
              {/* Report ID */}
              <td className="px-5 py-4 font-mono text-xs text-slate-400">
                {r.reportId}
              </td>

              {/* Analysis (Title & ID) */}
              <td className="px-5 py-4">
                <div className="font-semibold text-white truncate max-w-[220px]" title={r.title}>
                  {r.title}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {r.analysisId}
                </div>
              </td>

              {/* User ID */}
              <td className="px-5 py-4 text-xs">
                <span className="font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                  {r.userId || "user_default"}
                </span>
              </td>

              {/* Format Badge */}
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileText className="w-3 h-3" />
                  PDF
                </span>
              </td>

              {/* Created Date */}
              <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                </div>
              </td>

              {/* Actions */}
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewReport(r.reportId)}
                    title="View report details"
                    aria-label={`View report ${r.title}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {onDownloadReport && (
                    <button
                      onClick={() => onDownloadReport(r)}
                      title="Download PDF report"
                      aria-label={`Download report ${r.title}`}
                      className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}

                  {onDeleteReport && (
                    <button
                      onClick={() => onDeleteReport(r)}
                      title="Delete report"
                      aria-label={`Delete report ${r.title}`}
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
