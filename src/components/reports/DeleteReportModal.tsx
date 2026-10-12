import React from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteReportModalProps {
  isOpen: boolean;
  title?: string;
  itemTitle?: string;
  count?: number;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteReportModal({
  isOpen,
  title,
  itemTitle,
  count = 1,
  onCancel,
  onConfirm,
  isDeleting
}: DeleteReportModalProps) {
  if (!isOpen) return null;

  const isBulk = count > 1;
  const modalHeading = title || (isBulk ? `Delete ${count} reports?` : "Delete this report?");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 id="delete-dialog-title" className="text-xl font-bold text-white mb-2">
          {modalHeading}
        </h3>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {isBulk ? (
            <span>
              Are you sure you want to delete these <strong className="text-white">{count}</strong> reports? This action cannot be undone.
            </span>
          ) : (
            <span>
              Are you sure you want to delete {itemTitle ? <strong className="text-white font-semibold">"{itemTitle}"</strong> : "this report"}? This action cannot be undone.
            </span>
          )}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
