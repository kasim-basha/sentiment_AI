import React, { useState, useEffect, useMemo } from "react";
import { DashboardNavbar } from "./dashboard/DashboardNavbar";
import {
  User,
  ViewState,
  ReportRecord,
  ReportStatistics as ReportStatisticsType,
  ReportFilters as ReportFiltersType,
  ReportSortOption
} from "../types";
import { reportService } from "../services/reportService";
import { ReportsHeader } from "./reports/ReportsHeader";
import { ReportStatistics } from "./reports/ReportStatistics";
import { ReportSearch } from "./reports/ReportSearch";
import { ReportFilters } from "./reports/ReportFilters";
import { ReportSort } from "./reports/ReportSort";
import { ReportCard } from "./reports/ReportCard";
import { ReportViewer } from "./reports/ReportViewer";
import { ReportSelectionToolbar } from "./reports/ReportSelectionToolbar";
import { DeleteReportModal } from "./reports/DeleteReportModal";
import { ReportsEmptyState } from "./reports/ReportsEmptyState";
import { NoReportResults } from "./reports/NoReportResults";
import { ReportsSkeleton } from "./reports/ReportsSkeleton";
import { ReportsErrorState } from "./reports/ReportsErrorState";
import { ReportsPagination } from "./reports/ReportsPagination";
import { BulkDownloadModal } from "./history/BulkDownloadModal";
import { BulkShareModal } from "./history/BulkShareModal";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ShareModal } from "./share/ShareModal";
import { shareService } from "../services/shareService";

interface ReportsProps {
  user: User;
  onLogout: () => void;
  setView: (view: ViewState) => void;
  initialReportId?: string | null;
}

const ITEMS_PER_PAGE = 6;

const DEFAULT_FILTERS: ReportFiltersType = {
  inputType: "all",
  sentiment: "all",
  format: "all",
  date: "all"
};

export function Reports({ user, onLogout, setView, initialReportId }: ReportsProps) {
  const [allReports, setAllReports] = useState<ReportRecord[]>([]);
  const [stats, setStats] = useState<ReportStatisticsType>({
    totalReports: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Selected report for 👁️ View details
  const [activeReport, setActiveReport] = useState<ReportRecord | null>(null);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ReportFiltersType>(DEFAULT_FILTERS);
  const [sortOption, setSortOption] = useState<ReportSortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk selection state
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    report?: ReportRecord;
    isBulk?: boolean;
  }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareReport, setShareReport] = useState<ReportRecord | null>(null);
  const [isBulkDownloadOpen, setIsBulkDownloadOpen] = useState(false);
  const [isBulkShareOpen, setIsBulkShareOpen] = useState(false);

  // Notification toast
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Load all reports and statistics
  const loadReportsData = async () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(undefined);
    try {
      const [reportsList, reportStats] = await Promise.all([
        reportService.getReports(user.id),
        reportService.getReportStatistics(user.id)
      ]);

      setAllReports(reportsList);
      setStats(reportStats);

      // If initialReportId provided, select it
      if (initialReportId) {
        const found = reportsList.find(
          r => r.reportId === initialReportId || r.analysisId === initialReportId
        );
        if (found) {
          setActiveReport(found);
        } else {
          // Try fetching directly
          const direct = await reportService.getReportById(initialReportId);
          if (direct) {
            setActiveReport(direct);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      setHasError(true);
      setErrorMessage(err?.message || "Unable to load reports from storage.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [user.id, initialReportId]);

  // Dynamic search, filter, and sort pipeline
  const filteredReports = useMemo(() => {
    // 1. Search
    const searched = reportService.searchReports(searchQuery, allReports);
    // 2. Filter
    const filtered = reportService.filterReports(filters, searched);
    // 3. Sort
    return reportService.sortReports(sortOption, filtered);
  }, [allReports, searchQuery, filters, sortOption]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortOption]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredReports.map((r) => r.reportId));
    setSelectedReportIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedReportIds(new Set());
  };

  // View report details
  const handleViewReport = async (reportId: string) => {
    const found = allReports.find((r) => r.reportId === reportId || r.analysisId === reportId);
    if (found) {
      setActiveReport(found);
      window.location.hash = `#reports/${found.reportId}`;
    } else {
      const direct = await reportService.getReportById(reportId);
      if (direct) {
        setActiveReport(direct);
        window.location.hash = `#reports/${direct.reportId}`;
      }
    }
  };

  const handleBackToList = () => {
    setActiveReport(null);
    window.location.hash = "#reports";
  };

  // PDF Export
  const handleDownloadPDF = async (reportId: string) => {
    try {
      await reportService.generatePDF(reportId);
      showNotification("📄 PDF report generated and downloaded.");
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      showNotification("❌ Failed to generate PDF report.", "error");
    }
  };

  // TXT Export
  const handleExportTXT = async (reportId: string) => {
    try {
      await reportService.generateTXT(reportId);
      showNotification("📝 TXT report exported successfully.");
    } catch (err: any) {
      console.error("TXT export failed:", err);
      showNotification("❌ Failed to export TXT report.", "error");
    }
  };

  // Delete single report modal trigger
  const handlePromptDeleteSingle = (report: ReportRecord) => {
    setDeleteModal({
      isOpen: true,
      report,
      isBulk: false
    });
  };

  // Delete bulk reports modal trigger
  const handlePromptDeleteBulk = () => {
    if (selectedReportIds.size === 0) return;
    setDeleteModal({
      isOpen: true,
      isBulk: true
    });
  };

  const handleBulkDownloadClick = () => {
    if (selectedReportIds.size === 0) return;
    setIsBulkDownloadOpen(true);
  };

  const handleBulkShareClick = () => {
    if (selectedReportIds.size === 0) return;
    setIsBulkShareOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.isBulk) {
        const idsArray = Array.from(selectedReportIds) as string[];
        await reportService.deleteReports(idsArray);
        setSelectedReportIds(new Set());
        showNotification(`✅ Deleted ${idsArray.length} reports successfully.`);
      } else if (deleteModal.report) {
        await reportService.deleteReport(deleteModal.report.reportId);
        setSelectedReportIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteModal.report!.reportId);
          return next;
        });
        showNotification("✅ Report deleted successfully.");
        // If we were viewing this report, go back to list
        if (activeReport?.reportId === deleteModal.report.reportId) {
          setActiveReport(null);
          window.location.hash = "#reports";
        }
      }

      // Refresh data
      await loadReportsData();
      setDeleteModal({ isOpen: false });
    } catch (err) {
      console.error("Failed to delete report:", err);
      showNotification("❌ An error occurred while deleting. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <DashboardNavbar
        user={user}
        onLogout={onLogout}
        onNavigate={setView}
        currentView="reports"
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Floating Notification Toast */}
        {notification && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW 1: ACTIVE REPORT DETAILS */}
        {activeReport ? (
          <ReportViewer
            report={activeReport}
            onBack={handleBackToList}
            onNavigate={setView}
            onDownloadPDF={handleDownloadPDF}
            onExportTXT={handleExportTXT}
            onDelete={handlePromptDeleteSingle}
          />
        ) : (
          /* VIEW 2: REPORTS LIST & DIRECTORY */
          <>
            {/* Header */}
            <ReportsHeader onNewAnalysis={() => setView("my-analysis")} />

            {/* Statistics Row */}
            <ReportStatistics stats={stats} />

            {/* Loading State */}
            {isLoading ? (
              <ReportsSkeleton />
            ) : hasError ? (
              /* Error State */
              <ReportsErrorState
                onRetry={loadReportsData}
                onBackToDashboard={() => setView("dashboard")}
                errorMessage={errorMessage}
              />
            ) : allReports.length === 0 ? (
              /* Empty State: No reports at all */
              <ReportsEmptyState onStartAnalysis={() => setView("my-analysis")} />
            ) : (
              /* Main Reports Content */
              <div className="space-y-6">
                {/* Search & Sort Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <ReportSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    resultCount={filteredReports.length}
                  />

                  <ReportSort
                    value={sortOption}
                    onChange={setSortOption}
                  />
                </div>

                {/* Filters */}
                <ReportFilters
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleResetFilters}
                  totalFiltered={filteredReports.length}
                />

                {/* Bulk Selection Toolbar */}
                <ReportSelectionToolbar
                  selectedCount={selectedReportIds.size}
                  totalCount={filteredReports.length}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onDeleteSelected={handlePromptDeleteBulk}
                  onShareSelected={handleBulkShareClick}
                  onDownloadSelected={handleBulkDownloadClick}
                />

                {/* Reports Results or No Search Results */}
                {filteredReports.length === 0 ? (
                  <NoReportResults onClearFilters={handleResetFilters} />
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {paginatedReports.map((report) => (
                        <ReportCard
                          key={report.reportId}
                          report={report}
                          isSelected={selectedReportIds.has(report.reportId)}
                          onToggleSelect={handleToggleSelect}
                          onView={handleViewReport}
                          onDownloadPDF={handleDownloadPDF}
                          onExportTXT={handleExportTXT}
                          onShare={setShareReport}
                          onDelete={handlePromptDeleteSingle}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    <ReportsPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredReports.length}
                      itemsPerPage={ITEMS_PER_PAGE}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteReportModal
        isOpen={deleteModal.isOpen}
        itemTitle={deleteModal.report?.title}
        count={deleteModal.isBulk ? selectedReportIds.size : 1}
        onCancel={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Social & Multimodal Share Modal */}
      {shareReport && (
        <ShareModal
          isOpen={!!shareReport}
          onClose={() => setShareReport(null)}
          data={shareService.fromReportRecord(shareReport)}
        />
      )}

      <BulkDownloadModal
        isOpen={isBulkDownloadOpen}
        onClose={() => setIsBulkDownloadOpen(false)}
        selectedRecords={allReports
          .filter(r => selectedReportIds.has(r.reportId))
          .map(r => ({
            ...r,
            status: r.status || "completed",
            inputTypes: r.inputTypes || ["text"]
          }))}
      />

      <BulkShareModal
        isOpen={isBulkShareOpen}
        onClose={() => setIsBulkShareOpen(false)}
        selectedRecords={allReports
          .filter(r => selectedReportIds.has(r.reportId))
          .map(r => ({
            ...r,
            status: r.status || "completed",
            inputTypes: r.inputTypes || ["text"]
          }))}
      />
    </div>
  );
}
