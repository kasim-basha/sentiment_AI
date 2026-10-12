import React, { useState, useEffect, useMemo } from "react";
import { DashboardNavbar } from "./dashboard/DashboardNavbar";
import { User, ViewState, HistoryRecord, HistoryStatistics, HistoryFilters as HistoryFiltersType, HistorySortOption } from "../types";
import { historyService } from "../services/historyService";
import { HistoryHeader } from "./history/HistoryHeader";
import { HistoryStatisticsCards } from "./history/HistoryStatisticsCards";
import { HistorySearch } from "./history/HistorySearch";
import { HistoryFilters } from "./history/HistoryFilters";
import { HistorySort } from "./history/HistorySort";
import { HistoryCard } from "./history/HistoryCard";
import { HistorySelectionToolbar } from "./history/HistorySelectionToolbar";
import { DeleteConfirmationModal } from "./history/DeleteConfirmationModal";
import { EmptyHistoryState } from "./history/EmptyHistoryState";
import { NoSearchResults } from "./history/NoSearchResults";
import { HistorySkeleton } from "./history/HistorySkeleton";
import { HistoryErrorState } from "./history/HistoryErrorState";
import { HistoryPagination } from "./history/HistoryPagination";
import { BulkDownloadModal } from "./history/BulkDownloadModal";
import { BulkShareModal } from "./history/BulkShareModal";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ShareModal } from "./share/ShareModal";
import { shareService } from "../services/shareService";
import { CloudStorageHubModal } from "./cloud/CloudStorageHubModal";

interface HistoryProps {
  user: User;
  onLogout: () => void;
  setView: (view: ViewState) => void;
  onViewAnalysis?: (analysisId: string) => void;
  onViewReport?: (reportId: string) => void;
}

const ITEMS_PER_PAGE = 6;

const DEFAULT_FILTERS: HistoryFiltersType = {
  inputType: "all",
  sentiment: "all",
  date: "all",
  status: "all"
};

export function History({ user, onLogout, setView, onViewAnalysis, onViewReport }: HistoryProps) {
  const [allRecords, setAllRecords] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState<HistoryStatistics>({
    totalAnalyses: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<HistoryFiltersType>(DEFAULT_FILTERS);
  const [sortOption, setSortOption] = useState<HistorySortOption>("newest");

  // Selection & Bulk state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal & Notification state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item?: HistoryRecord;
    isBulk?: boolean;
  }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [shareRecord, setShareRecord] = useState<HistoryRecord | null>(null);

  const [isBulkDownloadOpen, setIsBulkDownloadOpen] = useState(false);
  const [isBulkShareOpen, setIsBulkShareOpen] = useState(false);
  const [isCloudStorageOpen, setIsCloudStorageOpen] = useState(false);

  // Load analyses and statistics from historyService
  const loadHistoryData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const records = await historyService.getAnalyses(user.id);
      const statistics = await historyService.getHistoryStatistics(user.id);
      setAllRecords(records);
      setStats(statistics);
    } catch (err) {
      console.error("Failed to fetch history data:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();
  }, [user.id]);

  // Count active filters (ignoring 'all')
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.inputType !== "all") count++;
    if (filters.sentiment !== "all") count++;
    if (filters.date !== "all") count++;
    if (filters.status !== "all") count++;
    return count;
  }, [filters]);

  // Compute filtered & sorted records
  const processedRecords = useMemo(() => {
    // 1. Filter
    let result = historyService.filterAnalyses(filters, allRecords);

    // 2. Search
    if (searchQuery.trim()) {
      result = historyService.searchAnalyses(searchQuery, result);
    }

    // 3. Sort
    result = historyService.sortAnalyses(sortOption, result);

    return result;
  }, [allRecords, filters, searchQuery, sortOption]);

  // Reset to page 1 whenever filters or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortOption]);

  // Pagination slicing
  const totalPages = Math.ceil(processedRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [processedRecords, currentPage]);

  // Handlers for Selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedRecords.length && paginatedRecords.length > 0) {
      // Deselect all on current page
      setSelectedIds(new Set());
    } else {
      // Select all on current page
      const next = new Set(paginatedRecords.map((r) => r.analysisId));
      setSelectedIds(next);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // View Analysis handler
  const handleView = (analysisId: string) => {
    if (onViewAnalysis) {
      onViewAnalysis(analysisId);
    } else {
      // Fallback
      setView("analysis-detail");
    }
  };

  // Trigger single item delete
  const handleDeleteClick = (record: HistoryRecord) => {
    setDeleteModal({
      isOpen: true,
      item: record,
      isBulk: false
    });
  };

  // Trigger bulk delete
  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteModal({
      isOpen: true,
      isBulk: true
    });
  };

  const handleBulkDownloadClick = () => {
    if (selectedIds.size === 0) return;
    setIsBulkDownloadOpen(true);
  };

  const handleBulkShareClick = () => {
    if (selectedIds.size === 0) return;
    setIsBulkShareOpen(true);
  };

  // Confirm delete (single or bulk)
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.isBulk) {
        const count = selectedIds.size;
        const idsToDelete = Array.from(selectedIds) as string[];
        await historyService.deleteAnalyses(idsToDelete);
        setSelectedIds(new Set());
        setNotification({
          message: `✅ ${count} ${count === 1 ? "analysis" : "analyses"} deleted successfully.`,
          type: "success"
        });
      } else if (deleteModal.item) {
        await historyService.deleteAnalysis(deleteModal.item.analysisId);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteModal.item!.analysisId);
          return next;
        });
        setNotification({
          message: "✅ Analysis deleted successfully.",
          type: "success"
        });
      }

      // Refresh records & stats
      const records = await historyService.getAnalyses(user.id);
      const statistics = await historyService.getHistoryStatistics(user.id);
      setAllRecords(records);
      setStats(statistics);

      setDeleteModal({ isOpen: false });

      // Auto-clear notification after 4s
      setTimeout(() => {
        setNotification(null);
      }, 4000);
    } catch (err) {
      console.error("Failed to delete analysis:", err);
      setNotification({
        message: "❌ An error occurred while deleting. Please try again.",
        type: "error"
      });
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
        currentView="history"
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Floating Notification Banner */}
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

        {/* Header */}
        <HistoryHeader
          onNavigate={setView}
          onOpenCloudStorage={() => setIsCloudStorageOpen(true)}
        />

        {/* Statistics Cards */}
        <HistoryStatisticsCards stats={stats} />

        {/* Bulk Selection Sticky Toolbar */}
        <HistorySelectionToolbar
          selectedCount={selectedIds.size}
          totalCount={processedRecords.length}
          allSelected={paginatedRecords.length > 0 && selectedIds.size === paginatedRecords.length}
          onToggleSelectAll={handleToggleSelectAll}
          onClearSelection={handleClearSelection}
          onDeleteSelected={handleBulkDeleteClick}
          onShareSelected={handleBulkShareClick}
          onDownloadSelected={handleBulkDownloadClick}
        />

        {/* Main Content Area */}
        {isLoading ? (
          <HistorySkeleton />
        ) : hasError ? (
          <HistoryErrorState onRetry={loadHistoryData} onNavigate={setView} />
        ) : allRecords.length === 0 ? (
          <EmptyHistoryState onNavigate={setView} />
        ) : (
          <div>
            {/* Search and Sort Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
              <div className="flex-1 max-w-lg">
                <HistorySearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  resultCount={processedRecords.length}
                />
              </div>
              <div className="flex items-center justify-end">
                <HistorySort value={sortOption} onChange={setSortOption} />
              </div>
            </div>

            {/* Filter Drawer */}
            <HistoryFilters
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              activeCount={activeFiltersCount}
            />

            {/* Content List / Cards */}
            {processedRecords.length === 0 ? (
              <NoSearchResults
                onClearFilters={handleResetFilters}
                searchQuery={searchQuery}
              />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 px-1 text-xs text-slate-400">
                  <span>
                    Showing <strong className="text-white">{processedRecords.length}</strong> {processedRecords.length === 1 ? "analysis" : "analyses"}
                  </span>
                  {selectedIds.size > 0 && (
                    <span className="text-blue-400 font-semibold">
                      {selectedIds.size} selected
                    </span>
                  )}
                </div>

                {/* Grid of Unified History Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {paginatedRecords.map((record) => (
                    <HistoryCard
                      key={record.analysisId}
                      record={record}
                      isSelected={selectedIds.has(record.analysisId)}
                      onToggleSelect={handleToggleSelect}
                      onView={handleView}
                      onViewReport={onViewReport}
                      onShare={setShareRecord}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <HistoryPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={processedRecords.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.isBulk ? `Delete ${selectedIds.size} selected analyses?` : "Delete this analysis?"}
        itemTitle={deleteModal.item?.title}
        count={deleteModal.isBulk ? selectedIds.size : undefined}
        onCancel={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Social & Multimodal Share Modal */}
      {shareRecord && (
        <ShareModal
          isOpen={!!shareRecord}
          onClose={() => setShareRecord(null)}
          data={shareService.fromHistoryRecord(shareRecord)}
        />
      )}

      <BulkDownloadModal
        isOpen={isBulkDownloadOpen}
        onClose={() => setIsBulkDownloadOpen(false)}
        selectedRecords={allRecords.filter(r => selectedIds.has(r.analysisId))}
      />

      <BulkShareModal
        isOpen={isBulkShareOpen}
        onClose={() => setIsBulkShareOpen(false)}
        selectedRecords={allRecords.filter(r => selectedIds.has(r.analysisId))}
      />

      <CloudStorageHubModal
        isOpen={isCloudStorageOpen}
        onClose={() => setIsCloudStorageOpen(false)}
        onRecordsUpdated={loadHistoryData}
      />
    </div>
  );
}
