import React, { useState } from "react";
import { Download, FileJson, FileSpreadsheet, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HistoryRecord } from "../../types";
import { historyService } from "../../services/historyService";
import { reportService } from "../../services/reportService";

interface BulkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecords: HistoryRecord[];
}

export function BulkDownloadModal({ isOpen, onClose, selectedRecords }: BulkDownloadModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "json" | "csv" | null>(null);

  if (!isOpen) return null;

  const handleExport = async (type: "pdf" | "json" | "csv") => {
    setIsExporting(true);
    setExportType(type);

    try {
      // Small delay for UI feel
      await new Promise(resolve => setTimeout(resolve, 800));

      if (type === "json") {
        historyService.exportToJSON(selectedRecords);
      } else if (type === "csv") {
        historyService.exportToCSV(selectedRecords);
      } else if (type === "pdf") {
        // For PDF, we'll download them sequentially with a small delay
        // Better than combining if the library is complex
        for (let i = 0; i < selectedRecords.length; i++) {
          await reportService.generatePDF(selectedRecords[i].analysisId);
          // Small delay to prevent browser block
          if (i < selectedRecords.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      onClose();
    } catch (err) {
      console.error("Bulk export failed:", err);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                Download Selected
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-6">
              You have selected <strong className="text-white">{selectedRecords.length}</strong> analyses. Choose your preferred export format below:
            </p>

            <div className="space-y-3">
              <button
                disabled={isExporting}
                onClick={() => handleExport("pdf")}
                className="w-full p-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Professional PDF</div>
                    <div className="text-xs text-slate-400">Detailed visual reports for each analysis</div>
                  </div>
                </div>
                {isExporting && exportType === "pdf" ? (
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500/20 group-hover:text-emerald-500/60" />
                )}
              </button>

              <button
                disabled={isExporting}
                onClick={() => handleExport("json")}
                className="w-full p-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">JSON Data</div>
                    <div className="text-xs text-slate-400">Raw machine-readable data for integration</div>
                  </div>
                </div>
                {isExporting && exportType === "json" ? (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-blue-500/20 group-hover:text-blue-500/60" />
                )}
              </button>

              <button
                disabled={isExporting}
                onClick={() => handleExport("csv")}
                className="w-full p-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-800 transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">CSV Spreadsheet</div>
                    <div className="text-xs text-slate-400">Structured table format for Excel/Sheets</div>
                  </div>
                </div>
                {isExporting && exportType === "csv" ? (
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-amber-500/20 group-hover:text-amber-500/60" />
                )}
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-slate-400 hover:text-white transition-colors text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
