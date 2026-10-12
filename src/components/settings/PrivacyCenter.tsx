import { useState, useEffect } from "react";
import { User, UserPrivacySettings, UserActiveSession, SecurityActivityEvent, UserDataExportSummary } from "../../types";
import { privacyService } from "../../services/privacyService";
import { securityService } from "../../services/securityService";
import {
  Shield, Key, HardDrive, Eye, Lock, Smartphone, Laptop, Globe,
  Trash2, Download, AlertTriangle, CheckCircle, RefreshCw, X,
  Activity, Clock, ChevronRight, Info, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PrivacyCenterProps {
  user: User;
  onLogout: () => void;
  onDataPurged?: (type: string) => void;
}

type TabType = "controls" | "security" | "data" | "activity" | "ai_policy";

export function PrivacyCenter({ user, onLogout, onDataPurged }: PrivacyCenterProps) {
  const [activeTab, setActiveTab] = useState<TabType>("controls");
  const [privacy, setPrivacy] = useState<UserPrivacySettings>({
    saveAnalysisHistory: true,
    autoDeleteHistory: "never",
    saveReports: true,
    personalizedExperience: true,
    saveClarityConversations: true,
    saveGoalTracking: true,
    saveSearchHistory: true,
    communityVisibility: "private"
  });

  const [sessions, setSessions] = useState<UserActiveSession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Modals & Purge Dialogs
  const [purgeTarget, setPurgeTarget] = useState<"analyses" | "reports" | "clarity" | "search" | "goals" | "account" | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [isPurging, setIsPurging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadPrivacyAndSecurity();
  }, [user.id]);

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const loadPrivacyAndSecurity = async () => {
    try {
      setIsLoading(true);
      const [privData, sessionList, events] = await Promise.all([
        privacyService.getPrivacySettings(user.id),
        securityService.getActiveSessions(),
        securityService.getSecurityActivity(25)
      ]);
      setPrivacy(privData);
      setSessions(sessionList);
      setSecurityEvents(events);
    } catch (err) {
      console.error("Failed to load privacy center data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async <K extends keyof UserPrivacySettings>(key: K, value: UserPrivacySettings[K]) => {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    try {
      await privacyService.updatePrivacySettings(user.id, { [key]: value });
      showStatus("Privacy setting updated");
    } catch (err) {
      showStatus("Failed to update setting", "error");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setIsChangingPassword(true);
      const msg = await securityService.changePassword(currentPassword, newPassword, confirmPassword);
      setPasswordSuccess(msg || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // refresh sessions and activity
      const [newSessions, newEvents] = await Promise.all([
        securityService.getActiveSessions(),
        securityService.getSecurityActivity(25)
      ]);
      setSessions(newSessions);
      setSecurityEvents(newEvents);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await securityService.logoutSession(sessionId);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      showStatus("Session terminated");
      const events = await securityService.getSecurityActivity(25);
      setSecurityEvents(events);
    } catch (err: any) {
      showStatus(err.message || "Failed to terminate session", "error");
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      const res = await securityService.logoutAllOtherSessions();
      setSessions(prev => prev.filter(s => s.isCurrentSession));
      showStatus(res.message || "Signed out of all other devices");
      const events = await securityService.getSecurityActivity(25);
      setSecurityEvents(events);
    } catch (err: any) {
      showStatus(err.message || "Failed to sign out other devices", "error");
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data: UserDataExportSummary = await privacyService.exportUserData();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentimentai-data-export-${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus("Your complete data archive has been downloaded");
    } catch (err: any) {
      showStatus(err.message || "Failed to export data", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const executePurge = async () => {
    if (!purgeTarget) return;
    try {
      setIsPurging(true);
      if (purgeTarget === "analyses") {
        const res = await privacyService.deleteAnalyses();
        showStatus(res.message);
        onDataPurged?.("analyses");
      } else if (purgeTarget === "reports") {
        const res = await privacyService.deleteReports();
        showStatus(res.message);
        onDataPurged?.("reports");
      } else if (purgeTarget === "clarity") {
        const res = await privacyService.deleteClarity();
        showStatus(res.message);
        onDataPurged?.("clarity");
      } else if (purgeTarget === "search") {
        const res = await privacyService.deleteSearchHistory();
        showStatus(res.message);
        onDataPurged?.("search");
      } else if (purgeTarget === "goals") {
        const res = await privacyService.deleteGoals();
        showStatus(res.message);
        onDataPurged?.("goals");
      } else if (purgeTarget === "account") {
        await privacyService.deleteAccount(deleteConfirmationInput);
        onLogout();
        return;
      }
      setPurgeTarget(null);
      setDeleteConfirmationInput("");
      const events = await securityService.getSecurityActivity(25);
      setSecurityEvents(events);
    } catch (err: any) {
      showStatus(err.message || "Purge operation failed", "error");
    } finally {
      setIsPurging(false);
    }
  };

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: "None", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, text: "Weak", color: "bg-rose-500" };
    if (score <= 4) return { score: 2, text: "Medium", color: "bg-amber-500" };
    return { score: 3, text: "Strong", color: "bg-emerald-500" };
  };

  const strength = calculatePasswordStrength(newPassword);

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold border ${
              statusMessage.type === "success"
                ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/70 border-rose-500/40 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {statusMessage.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> Privacy & Security Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Control Your Data & Safeguard Your Account
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              SentimentAI is private by default. Manage your analysis persistence, review active devices, control visibility, and export or purge data on demand.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              {isExporting ? "Exporting..." : "Export Full Archive"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
        {[
          { id: "controls", label: "Privacy Controls", icon: Lock },
          { id: "security", label: "Account Security", icon: Key },
          { id: "data", label: "Data Management", icon: HardDrive },
          { id: "activity", label: "Security Activity", icon: Activity },
          { id: "ai_policy", label: "AI & Privacy Policy", icon: Info },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRIVACY CONTROLS */}
      {activeTab === "controls" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Analysis & Storage Controls</h3>
              <p className="text-xs text-slate-400">Configure how SentimentAI records and retains your multimodal analyses and interactions.</p>
            </div>

            <div className="space-y-4">
              {/* Save History Toggle */}
              <div
                className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-800/70 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => handleToggle("saveAnalysisHistory", !privacy.saveAnalysisHistory)}
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Save Analysis History</span>
                    {!privacy.saveAnalysisHistory && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">Ephemeral Mode Active</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    When turned on, your multimodal analysis results and sentiment breakdowns are safely stored in your account history. When turned off, analyses run in real-time without database persistence.
                  </p>
                </div>
                <ToggleSwitch checked={privacy.saveAnalysisHistory} onChange={(v) => handleToggle("saveAnalysisHistory", v)} />
              </div>

              {/* Auto-Delete Timing */}
              {privacy.saveAnalysisHistory && (
                <div className="p-5 rounded-2xl bg-slate-950/30 border border-slate-800/50 space-y-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white uppercase tracking-wider">Auto-Delete History Retention</div>
                    <div className="text-xs text-slate-400">Choose when saved analyses should be automatically deleted from your account.</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {[
                      { id: "never", title: "Never (Retain Indefinitely)", desc: "Keep until manual deletion" },
                      { id: "after_24h", title: "After 24 Hours", desc: "Purged automatically daily" },
                      { id: "after_use", title: "After Session", desc: "Discard upon page departure" },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleToggle("autoDeleteHistory", opt.id as any)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          privacy.autoDeleteHistory === opt.id
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold mb-1">{opt.title}</div>
                        <div className="text-[11px] text-slate-500">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Reports */}
              <div
                className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-800/70 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => handleToggle("saveReports", !privacy.saveReports)}
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">Save Executive & Clinical Reports</div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    Allow generated PDF/JSON summary reports to be archived in your Reports dashboard.
                  </p>
                </div>
                <ToggleSwitch checked={privacy.saveReports} onChange={(v) => handleToggle("saveReports", v)} />
              </div>

              {/* Save Clarity Assistant */}
              <div
                className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-800/70 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => handleToggle("saveClarityConversations", !privacy.saveClarityConversations)}
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">Save AI Clarity Assistant Conversations</div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    Keep your contextual clarification chats and evidence queries linked to your sessions.
                  </p>
                </div>
                <ToggleSwitch checked={privacy.saveClarityConversations} onChange={(v) => handleToggle("saveClarityConversations", v)} />
              </div>

              {/* Save Goals */}
              <div
                className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-800/70 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => handleToggle("saveGoalTracking", !privacy.saveGoalTracking)}
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">Save Goals & Mood Tracking Telemetry</div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    Record emotional pattern milestones, streak calculations, and target sentiment percentages.
                  </p>
                </div>
                <ToggleSwitch checked={privacy.saveGoalTracking} onChange={(v) => handleToggle("saveGoalTracking", v)} />
              </div>

              {/* Save Search History */}
              <div
                className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-800/70 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => handleToggle("saveSearchHistory", !privacy.saveSearchHistory)}
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">Save Global Search History</div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    Save recent keyword queries across sessions, posts, and contacts for fast auto-complete suggestions.
                  </p>
                </div>
                <ToggleSwitch checked={privacy.saveSearchHistory} onChange={(v) => handleToggle("saveSearchHistory", v)} />
              </div>

              {/* Personalized Experience */}
              <div
                className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-800/70 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => handleToggle("personalizedExperience", !privacy.personalizedExperience)}
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">AI Personalization & Recommendations</div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    Enable the AI engine to generate personalized sentiment advice based on your historical emotion trajectories.
                  </p>
                </div>
                <ToggleSwitch checked={privacy.personalizedExperience} onChange={(v) => handleToggle("personalizedExperience", v)} />
              </div>

              {/* Community Visibility */}
              <div className="p-5 rounded-2xl bg-slate-950/30 border border-slate-800/50 space-y-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Default Sharing & Community Visibility</div>
                  <div className="text-xs text-slate-400">Choose who can view your shared community insights by default.</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    { id: "private", title: "Private (Default)", desc: "Only visible to your account" },
                    { id: "community", title: "Community Members", desc: "Authenticated users only" },
                    { id: "public", title: "Public", desc: "Anyone with direct link" },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleToggle("communityVisibility", opt.id as any)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        privacy.communityVisibility === opt.id
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold mb-1">{opt.title}</div>
                      <div className="text-[11px] text-slate-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: ACCOUNT SECURITY */}
      {activeTab === "security" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Password Change Form */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" /> Change Password
                </h3>
                <p className="text-xs text-slate-400">Ensure your account is protected with a strong, distinct password.</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 8 characters)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
                />
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Password strength:</span>
                      <span className="font-bold text-slate-200">{strength.text}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 ${strength.score >= 1 ? strength.color : "bg-slate-800"}`} />
                      <div className={`h-full flex-1 ${strength.score >= 2 ? strength.color : "bg-slate-800"}`} />
                      <div className={`h-full flex-1 ${strength.score >= 3 ? strength.color : "bg-slate-800"}`} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {isChangingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Active Sessions */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-teal-400" /> Active Sessions & Devices
                </h3>
                <p className="text-xs text-slate-400">Devices currently authenticated into your SentimentAI account.</p>
              </div>

              {sessions.length > 1 && (
                <button
                  onClick={handleRevokeAllOtherSessions}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out of All Other Devices
                </button>
              )}
            </div>

            <div className="space-y-3">
              {sessions.map(sess => {
                const isDesktop = sess.deviceType === "desktop";
                return (
                  <div
                    key={sess.sessionId}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                      sess.isCurrentSession
                        ? "bg-indigo-950/30 border-indigo-500/30"
                        : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl ${sess.isCurrentSession ? "bg-indigo-600/20 text-indigo-400" : "bg-slate-800 text-slate-400"}`}>
                        {isDesktop ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{sess.deviceName}</span>
                          {sess.isCurrentSession && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                              Current Device
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>{sess.browser} • {sess.os}</span>
                          <span>IP: {sess.ipAddress}</span>
                        </div>
                      </div>
                    </div>

                    {!sess.isCurrentSession && (
                      <button
                        onClick={() => handleRevokeSession(sess.sessionId)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 3: DATA MANAGEMENT */}
      {activeTab === "data" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Data Export Box */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Download className="w-5 h-5 text-indigo-400" /> Export Your SentimentAI Data
                </h3>
                <p className="text-xs text-slate-400">Download a full JSON archive containing your analyses, generated reports, tracking goals, clarity chats, and profile metadata.</p>
              </div>

              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Generating Archive..." : "Download JSON Archive"}
              </button>
            </div>
          </div>

          {/* Granular Purging */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" /> Granular Data Purging
              </h3>
              <p className="text-xs text-slate-400">Permanently delete specific categories of data without affecting the rest of your account.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { target: "analyses" as const, title: "Clear Analysis History", desc: "Permanently deletes all multimodal analyses, emotion timelines, and input logs." },
                { target: "reports" as const, title: "Clear Generated Reports", desc: "Removes all saved PDF/JSON executive summaries and emotion reports." },
                { target: "clarity" as const, title: "Clear Clarity Conversations", desc: "Deletes all AI Clarity Assistant conversation transcripts and evidence queries." },
                { target: "search" as const, title: "Clear Search History", desc: "Clears your search query history and auto-complete cache." },
                { target: "goals" as const, title: "Clear Goals & Mood Tracking", desc: "Removes all tracked sentiment goals, streaks, and emotion milestone records." },
              ].map(item => (
                <div key={item.target} className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">{item.title}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => {
                      setPurgeTarget(item.target);
                      setDeleteConfirmationInput("");
                    }}
                    className="self-start px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Purge Data
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Danger Zone: Permanent Account Deletion</h3>
                <p className="text-xs text-slate-400">Irreversibly delete your SentimentAI account, profile, posts, messages, and all analysis data.</p>
              </div>
            </div>

            <p className="text-xs text-rose-300/80 leading-relaxed">
              Once initiated, all associated multimodal data, emotion records, friendships, and active sessions will be permanently purged in accordance with zero-retention policies.
            </p>

            <button
              onClick={() => {
                setPurgeTarget("account");
                setDeleteConfirmationInput("");
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
            >
              <Trash2 className="w-4 h-4" /> Delete My Account Permanently
            </button>
          </div>
        </motion.div>
      )}

      {/* TAB 4: SECURITY ACTIVITY */}
      {activeTab === "activity" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" /> Security Audit Log
                </h3>
                <p className="text-xs text-slate-400">Review recent security events, logins, and settings updates on your account.</p>
              </div>
              <button
                onClick={loadPrivacyAndSecurity}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Refresh log"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {securityEvents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No recent security events recorded.</div>
              ) : (
                securityEvents.map(evt => {
                  return (
                    <div
                      key={evt.id}
                      className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-800 text-indigo-400 shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {evt.action.replace(/_/g, " ")}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Target: {evt.targetType}</span>
                            <span>•</span>
                            <span>IP: {evt.ipAddress}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-slate-300">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(evt.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 5: AI & PRIVACY POLICY */}
      {activeTab === "ai_policy" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" /> SentimentAI Privacy & AI Data Commitment
              </h3>
              <p className="text-xs text-slate-400">Our core architecture principles ensure your multimodal media and emotional data remain strictly yours.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                <div className="text-sm font-bold text-indigo-300">🔒 Private By Default</div>
                <p className="text-xs text-slate-400">
                  All analyses, audio recordings, text entries, and video frames are scoped strictly to your authenticated session. They are never published or made discoverable without explicit consent.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                <div className="text-sm font-bold text-teal-300">🚫 No Third-Party Model Training</div>
                <p className="text-xs text-slate-400">
                  Your uploaded media files and personal voice recordings are never used to train public foundation models or sold to third-party advertisers.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                <div className="text-sm font-bold text-emerald-300">⚡ Ephemeral Analysis Mode</div>
                <p className="text-xs text-slate-400">
                  You can toggle off history saving at any moment. In ephemeral mode, inputs are processed in-memory for your real-time dashboard and discarded immediately.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                <div className="text-sm font-bold text-amber-300">🗑️ Complete Data Ownership</div>
                <p className="text-xs text-slate-400">
                  You maintain full sovereignty over your data with one-click full archive exports and granular permanent deletion for any subsystem at any time.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      {purgeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !isPurging && setPurgeTarget(null)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 space-y-6">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                {purgeTarget === "account" ? "Delete Account Permanently?" : `Purge ${purgeTarget}?`}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {purgeTarget === "account"
                  ? "This action is irreversible. All analyses, reports, messages, and profile data will be permanently destroyed."
                  : `Are you sure you want to delete all saved ${purgeTarget}? This action cannot be undone.`
                }
              </p>
            </div>

            {purgeTarget === "account" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Type <span className="text-rose-400 font-bold">DELETE</span> or your current password to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-rose-500 placeholder:text-slate-600"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                disabled={isPurging}
                onClick={() => setPurgeTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isPurging || (purgeTarget === "account" && !deleteConfirmationInput)}
                onClick={executePurge}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isPurging ? "Purging..." : "Confirm Purge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable switch toggle
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        checked ? "bg-indigo-600" : "bg-slate-700"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? "translate-x-2.5" : "-translate-x-2.5"
        }`}
      />
    </button>
  );
}
