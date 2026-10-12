import React from "react";
import { X, User, Mail, Calendar, Clock, Shield, CheckCircle2, AlertOctagon, BarChart3, FileText } from "lucide-react";
import { UserProfile } from "../../types";
import { motion, AnimatePresence } from "motion/react";

interface UserDetailsProps {
  user: (UserProfile & {
    analysesStats?: {
      total: number;
      positive: number;
      negative: number;
      neutral: number;
      mixed: number;
    };
    reportsStats?: {
      total: number;
      pdf: number;
      txt: number;
    };
  }) | null;
  onClose: () => void;
}

export function UserDetails({ user, onClose }: UserDetailsProps) {
  if (!user) return null;

  const analysisStats = user.analysesStats || {
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0
  };

  const reportStats = user.reportsStats || {
    total: 0,
    pdf: 0,
    txt: 0
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-2xl">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {user.fullName}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-slate-500">{user.userId}</span>
                  <span>•</span>
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close user details"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section: Personal & Account Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              👤 Personal Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-500 font-medium">Account Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${user.accountStatus === 'active' ? 'bg-emerald-400 ring-4 ring-emerald-500/20' : 'bg-rose-400 ring-4 ring-rose-500/20'}`} />
                  <span className={`text-sm font-bold capitalize ${user.accountStatus === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {user.accountStatus}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-500 font-medium">Role</span>
                <div className="mt-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-white uppercase">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-500 font-medium">Member Since</span>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-200">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-500 font-medium">Last Login</span>
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-200">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : "Never logged in"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Analysis Statistics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                📊 Analysis Statistics
              </h4>
              <span className="text-xs font-bold text-purple-400 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                Total: {analysisStats.total}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-400">Positive</span>
                <p className="text-lg font-bold text-emerald-300 mt-1">{analysisStats.positive}</p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-400">Negative</span>
                <p className="text-lg font-bold text-rose-300 mt-1">{analysisStats.negative}</p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-400">Neutral</span>
                <p className="text-lg font-bold text-blue-300 mt-1">{analysisStats.neutral}</p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-400">Mixed</span>
                <p className="text-lg font-bold text-amber-300 mt-1">{analysisStats.mixed}</p>
              </div>
            </div>
          </div>

          {/* Section: Report Statistics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                📄 Report Statistics
              </h4>
              <span className="text-xs font-bold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Total: {reportStats.total}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">PDF Reports</span>
                  <p className="text-sm font-bold text-white mt-0.5">Portable Document</p>
                </div>
                <span className="text-lg font-bold text-emerald-400">{reportStats.pdf}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">TXT Reports</span>
                  <p className="text-sm font-bold text-white mt-0.5">Plain Text</p>
                </div>
                <span className="text-lg font-bold text-blue-400">{reportStats.txt}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
