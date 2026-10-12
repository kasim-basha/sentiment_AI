import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle,
  Trash2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Loader2,
  Check,
  ExternalLink
} from "lucide-react";
import { CommunityReport, ModerationStatus, User } from "../../types";
import { moderationService } from "../../services/moderationService";

interface CommunityModerationManagementProps {
  admin: User;
}

export function CommunityModerationManagement({ admin }: CommunityModerationManagementProps) {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await moderationService.getReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to load moderation reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const showFeedback = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Moderation Actions
  const handleApproveContent = async (report: CommunityReport) => {
    await moderationService.updateReportStatus(report.reportId, "reviewed");
    showFeedback(`Report #${report.reportId.slice(-4)} marked as Approved (Content retained).`);
    await loadReports();
  };

  const handleRemoveContent = async (report: CommunityReport) => {
    if (window.confirm("Are you sure you want to permanently remove this reported content from the community?")) {
      await moderationService.removeReportedContent(report, admin.id);
      showFeedback(`Reported content permanently removed and report marked as Resolved.`);
      await loadReports();
    }
  };

  const handleWarnUser = async (report: CommunityReport) => {
    const warningMessage = prompt(
      `Enter administrative warning to issue to user '${report.reportedUserName}':`,
      "Your recent post violates SentimentAI Community Guidelines. Further infractions may result in account suspension."
    );
    if (warningMessage) {
      await moderationService.updateReportStatus(report.reportId, "resolved");
      showFeedback(`Administrative warning issued to ${report.reportedUserName}.`);
      await loadReports();
    }
  };

  const handleDismissReport = async (report: CommunityReport) => {
    await moderationService.updateReportStatus(report.reportId, "dismissed");
    showFeedback(`Report #${report.reportId.slice(-4)} dismissed.`);
    await loadReports();
  };

  // Filter and search
  const filteredReports = reports.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      r.reportedUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contentSnippet?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ModerationStatus) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "reviewed":
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      case "resolved":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "dismissed":
        return "bg-slate-700/50 text-slate-400 border-slate-600/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action notice toast */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by user, reason, or content..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(["all", "pending", "reviewed", "resolved", "dismissed"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table / Feed */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Loading moderation queue...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
          No moderation reports matching criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.reportId}
              className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 hover:border-slate-700/80 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {report.commentId ? "💬 Reported Comment" : "📝 Reported Post"}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {report.reportId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${getStatusBadge(report.status)}`}>
                    {report.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Reported Content Snippet */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Reported Content Snippet
                </span>
                <p className="text-xs text-slate-200 italic line-clamp-3">
                  "{report.contentSnippet || "Content not available"}"
                </p>
              </div>

              {/* Report Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Reason</span>
                  <span className="font-semibold text-amber-300">{report.reason}</span>
                  {report.details && (
                    <p className="text-[11px] text-slate-400 mt-1">{report.details}</p>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Reported User</span>
                  <span className="font-semibold text-slate-200">{report.reportedUserName}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">ID: {report.reportedUserId}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Reporter</span>
                  <span className="font-semibold text-slate-200">{report.reporterName}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">ID: {report.reporterId}</span>
                </div>
              </div>

              {/* Admin Moderation Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleApproveContent(report)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Approve and keep content"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Approve Content</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWarnUser(report)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Issue warning to author"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Warn User</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDismissReport(report)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Dismiss this report"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Dismiss Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveContent(report)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Remove permanently from community feed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Content</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
