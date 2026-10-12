import React from "react";
import { Trash2, CheckSquare, Square, X, Share2, Download } from "lucide-react";

interface HistorySelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onShareSelected: () => void;
  onDownloadSelected: () => void;
}

export function HistorySelectionToolbar({
  selectedCount,
  totalCount,
  allSelected,
  onToggleSelectAll,
  onClearSelection,
  onDeleteSelected,
  onShareSelected,
  onDownloadSelected
}: HistorySelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-20 z-30 mb-6 p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-900/50 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
        >
          {allSelected ? (
            <CheckSquare className="w-4 h-4 text-blue-400" />
          ) : (
            <Square className="w-4 h-4 text-blue-400" />
          )}
          <span>{allSelected ? "Deselect All" : "Select All"}</span>
        </button>

        <div className="h-4 w-px bg-blue-500/30" />

        <span className="text-xs font-bold text-white">
          <span className="text-blue-300">{selectedCount}</span> of {totalCount} analyses selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClearSelection}
          className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-blue-900/40 text-xs font-medium transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2 border-l border-slate-700 pl-2 ml-1">
          <button
            type="button"
            onClick={onShareSelected}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Selected</span>
          </button>

          <button
            type="button"
            onClick={onDownloadSelected}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Selected</span>
          </button>

          <button
            type="button"
            onClick={onDeleteSelected}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
        </div>
      </div>
    </div>
  );
}
