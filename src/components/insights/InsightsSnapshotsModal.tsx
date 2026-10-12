import React from "react";
import { AIInsightSnapshot } from "../../types";
import {
  X,
  Trash2,
  Eye,
  Calendar,
  Bookmark,
  Sparkles,
  ShieldCheck
} from "lucide-react";

interface InsightsSnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: AIInsightSnapshot[];
  onSelectSnapshot: (snapshot: AIInsightSnapshot) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
}

export const InsightsSnapshotsModal: React.FC<InsightsSnapshotsModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onSelectSnapshot,
  onDeleteSnapshot
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        id="insights-snapshots-modal"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Saved AI Insights Snapshots
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review historical analysis reports and compare past sentiment patterns
              </p>
            </div>
          </div>

          <button
            id="close-snapshots-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-3">
          {snapshots.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bookmark className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Saved Snapshots Yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                Click "Save Snapshot" in the insights filter bar to preserve the current AI analysis report for future review.
              </p>
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                id={`snapshot-${snap.id}`}
                className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300">
                      <Calendar className="w-3 h-3" />
                      <span>{snap.dateRange.toUpperCase()}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>{snap.confidenceScore.toUpperCase()} Certainty</span>
                    </span>

                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      • {snap.totalAnalyses} sessions
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {snap.summary}
                  </p>

                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Saved on {new Date(snap.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700">
                  <button
                    id={`view-snapshot-${snap.id}`}
                    onClick={() => {
                      onSelectSnapshot(snap);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    id={`delete-snapshot-${snap.id}`}
                    onClick={() => onDeleteSnapshot(snap.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete snapshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
