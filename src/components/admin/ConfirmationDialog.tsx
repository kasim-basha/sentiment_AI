import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const iconMap = {
    danger: <AlertTriangle className="w-6 h-6 text-rose-500" />,
    warning: <AlertCircle className="w-6 h-6 text-amber-500" />,
    info: <AlertCircle className="w-6 h-6 text-blue-500" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-500" />
  };

  const bgIconMap = {
    danger: "bg-rose-500/10 border-rose-500/20",
    warning: "bg-amber-500/10 border-amber-500/20",
    info: "bg-blue-500/10 border-blue-500/20",
    success: "bg-emerald-500/10 border-emerald-500/20"
  };

  const btnConfirmClass = {
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30",
    warning: "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30",
    info: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${bgIconMap[variant]}`}>
              {iconMap[variant]}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-7 pt-5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm focus:outline-none focus:ring-2 ${btnConfirmClass[variant]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
