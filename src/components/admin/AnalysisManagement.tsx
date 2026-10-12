import React, { useState, useEffect } from "react";
import {
  Brain,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { HistoryRecord, User } from "../../types";
import { adminService } from "../../services/adminService";
import { auditLogService } from "../../services/auditLogService";
import { AnalysisTable } from "./AnalysisTable";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { AdminTableSkeleton } from "./AdminSkeleton";

interface AnalysisManagementProps {
  admin: User;
  onNavigateToAnalysis: (analysisId: string) => void;
}

export function AnalysisManagement({ admin, onNavigateToAnalysis }: AnalysisManagementProps) {
  const [analyses, setAnalyses] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Deletion confirmation
  const [deleteTarget, setDeleteTarget] = useState<HistoryRecord | null>(null);

  // Toast feedback
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAnalyses();
      setAnalyses(data);
    } catch (err) {
      console.error("Failed to load analyses:", err);
      setFeedback({ message: "Unable to retrieve analysis records.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const ok = await adminService.deleteAnalysis(deleteTarget.analysisId);
      if (ok) {
        await auditLogService.log({
          adminId: admin.id,
          adminName: admin.name,
          action: "ANALYSIS_DELETED",
          targetId: deleteTarget.analysisId,
          targetName: deleteTarget.title,
          details: `Admin deleted analysis record ${deleteTarget.analysisId}`
        });
        showToast("✅ Analysis deleted successfully.");
        await loadAnalyses();
      } else {
        showToast("Failed to delete analysis.", "error");
      }
    } catch (err) {
      console.error("Deletion error:", err);
      showToast("Error executing deletion.", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Filter and sort analyses
  const filteredAnalyses = analyses.filter((a) => {
    // Search query
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.analysisId && a.analysisId.toLowerCase().includes(q)) ||
      (a.userId && a.userId.toLowerCase().includes(q)) ||
      (a.summary && a.summary.toLowerCase().includes(q));

    // Input Type filter
    let matchesType = true;
    if (typeFilter !== "all") {
      if (typeFilter === "mixed") {
        matchesType = Boolean(a.inputTypes && a.inputTypes.length > 1);
      } else {
        matchesType = Boolean(a.inputTypes && a.inputTypes.includes(typeFilter as any));
      }
    }

    // Sentiment filter
    const matchesSentiment =
      sentimentFilter === "all" ||
      a.overallSentiment?.label === sentimentFilter;

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (a.status || "completed").toLowerCase() === statusFilter.toLowerCase();

    // Date range filter
    let matchesDate = true;
    if (dateFilter !== "all") {
      const recordTime = new Date(a.createdAt).getTime();
      const now = Date.now();
      if (dateFilter === "today") {
        matchesDate = (now - recordTime) <= 24 * 60 * 60 * 1000;
      } else if (dateFilter === "last7") {
        matchesDate = (now - recordTime) <= 7 * 24 * 60 * 60 * 1000;
      } else if (dateFilter === "last30") {
        matchesDate = (now - recordTime) <= 30 * 24 * 60 * 60 * 1000;
      }
    }

    return matchesSearch && matchesType && matchesSentiment && matchesStatus && matchesDate;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            🧠 Analysis Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit, filter, and inspect platform analysis records across all modalities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </button>

          <button
            onClick={loadAnalyses}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
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

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="🔍 Search analyses by title, ID, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Input Type */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:border-purple-500 focus:outline-none transition-colors"
          >
            <option value="all">All Types</option>
            <option value="text">📝 Text</option>
            <option value="image">🖼️ Image</option>
            <option value="video">🎥 Video</option>
            <option value="mixed">🔀 Mixed</option>
          </select>
        </div>

        {/* Sentiment */}
        <div>
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:border-purple-500 focus:outline-none transition-colors"
          >
            <option value="all">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
            <option value="Neutral">Neutral</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:border-purple-500 focus:outline-none transition-colors"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <AdminTableSkeleton rows={5} cols={8} />
        ) : (
          <AnalysisTable
            analyses={filteredAnalyses}
            onViewAnalysis={onNavigateToAnalysis}
            onDeleteAnalysis={(a) => setDeleteTarget(a)}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete this analysis record?"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}" (${deleteTarget?.analysisId})? This action cannot be undone.`}
        confirmLabel="Delete Analysis"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
