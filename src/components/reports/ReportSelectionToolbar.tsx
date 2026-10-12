import React from "react";
import { Trash2, CheckSquare, Square, X, Share2, Download } from "lucide-react";

interface ReportSelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onShareSelected: () => void;
  onDownloadSelected: () => void;
}

export function ReportSelectionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onShareSelected,
  onDownloadSelected
}: ReportSelectionToolbarProps) {
  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={isAllSelected ? onDeselectAll : onSelectAll}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-300 hover:text-white transition-colors cursor-pointer"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4 text-blue-400" />
          ) : (
            <Square className="w-4 h-4 text-slate-400" />
          )}
          <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
        </button>

        <span className="text-xs text-slate-400">
          <strong className="text-white">{selectedCount}</strong> report{selectedCount > 1 ? "s" : ""} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onShareSelected}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        <button
          type="button"
          onClick={onDownloadSelected}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>

        <button
          type="button"
          onClick={onDeleteSelected}
          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20 active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block" />

        <button
          type="button"
          onClick={onDeselectAll}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          aria-label="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
