import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ReportRecord, User } from "../../types";
import { adminService } from "../../services/adminService";
import { reportService } from "../../services/reportService";
import { auditLogService } from "../../services/auditLogService";
import { ReportTable } from "./ReportTable";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { AdminTableSkeleton } from "./AdminSkeleton";

interface ReportManagementProps {
  admin: User;
  onNavigateToReport: (reportId: string) => void;
}

export function ReportManagement({ admin, onNavigateToReport }: ReportManagementProps) {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");

  // Deletion target
  const [deleteTarget, setDeleteTarget] = useState<ReportRecord | null>(null);

  // Toast feedback
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await adminService.getReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setFeedback({ message: "Unable to load reports.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDownload = async (report: ReportRecord) => {
    try {
      await reportService.generatePDF(report.analysisId);
      showToast("Report download initiated.");
    } catch (err) {
      console.error("Download failed:", err);
      showToast("Failed to download report PDF.", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const ok = await adminService.deleteReport(deleteTarget.reportId);
      if (ok) {
        await auditLogService.log({
          adminId: admin.id,
          adminName: admin.name,
          action: "REPORT_DELETED",
          targetId: deleteTarget.reportId,
          targetName: deleteTarget.title,
          details: `Admin removed report ${deleteTarget.reportId}`
        });
        showToast("✅ Report deleted successfully.");
        await loadReports();
      } else {
        showToast("Failed to delete report.", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Error deleting report.", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.reportId && r.reportId.toLowerCase().includes(q)) ||
      (r.analysisId && r.analysisId.toLowerCase().includes(q)) ||
      (r.userId && r.userId.toLowerCase().includes(q));

    const matchesFormat =
      formatFilter === "all" ||
      (formatFilter === "pdf"); // Currently generated reports are PDF format

    return matchesSearch && matchesFormat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            📄 Report Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Access, download, and manage intelligence reports generated across the organization.
          </p>
        </div>

        <button
          onClick={loadReports}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold transition-all ${
          feedback.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="🔍 Search reports by title, report ID, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none transition-colors"
          >
            <option value="all">All Formats</option>
            <option value="pdf">PDF Document</option>
            <option value="txt">TXT Document</option>
          </select>
        </div>
      </div>

      {/* Reports Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <AdminTableSkeleton rows={5} cols={6} />
        ) : (
          <ReportTable
            reports={filteredReports}
            onViewReport={onNavigateToReport}
            onDownloadReport={handleDownload}
            onDeleteReport={(r) => setDeleteTarget(r)}
          />
        )}
      </div>

      {/* Confirmation Dialog for Destructive Action */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete this report?"
        description={`Are you sure you want to delete report "${deleteTarget?.title}" (${deleteTarget?.reportId})? Any destructive action requires explicit confirmation.`}
        confirmLabel="Delete Report"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
