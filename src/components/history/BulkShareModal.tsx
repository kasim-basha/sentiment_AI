import React, { useState } from "react";
import { Share2, X, Link as LinkIcon, Check, Copy, MessageSquare, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HistoryRecord } from "../../types";
import { shareService } from "../../services/shareService";

interface BulkShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecords: HistoryRecord[];
}

export function BulkShareModal({ isOpen, onClose, selectedRecords }: BulkShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getBulkShareText = () => {
    const header = `📊 SentimentAI - Bulk Analysis Sharing (${selectedRecords.length} items)\n\n`;
    const items = selectedRecords.map(r => {
      const url = shareService.getShareableUrl("analysis", r.analysisId);
      return `• ${r.title}\n  Sentiment: ${r.overallSentiment?.label} (${Math.round(r.overallSentiment?.score * 100)}%)\n  Link: ${url}`;
    }).join("\n\n");
    return header + items;
  };

  const handleCopyAll = async () => {
    const text = getBulkShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleEmailShare = () => {
    const text = getBulkShareText();
    const subject = `Shared SentimentAI Analyses (${selectedRecords.length} items)`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.location.href = mailtoUrl;
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
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                Share Selected Batch
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-6">
              You are sharing <strong className="text-white">{selectedRecords.length}</strong> analyses. You can copy a consolidated summary with all links or share via email.
            </p>

            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 mb-6 max-h-48 overflow-y-auto custom-scrollbar">
              <pre className="text-xs text-blue-300 font-mono whitespace-pre-wrap">
                {getBulkShareText()}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCopyAll}
                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                <span>{copied ? "Copied!" : "Copy All Links"}</span>
              </button>

              <button
                onClick={handleEmailShare}
                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-all active:scale-[0.98]"
              >
                <Mail className="w-5 h-5" />
                <span>Share via Email</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Secure Bulk Analysis Sharing
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
