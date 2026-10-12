import { useState, useEffect } from "react";
import { User, ViewState, UserSettings } from "../../types";
import { DashboardNavbar } from "../dashboard/DashboardNavbar";
import { settingsService } from "../../services/settingsService";
import {
  Settings as SettingsIcon, Sun, Moon, Droplets, Leaf, Flame, Sparkles, Bell,
  Globe, Shield, Trash2, RotateCcw, AlertCircle, Save, Check, User as UserIcon,
  Cloud, Database, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PrivacyCenter } from "./PrivacyCenter";
import { CloudStorageHubModal } from "../cloud/CloudStorageHubModal";
import { cloudStorageService } from "../../services/cloudStorageService";

interface SettingsPageProps {
  user: User;
  onLogout: () => void;
  setView: (view: ViewState) => void;
}

export function SettingsPage({ user, onLogout, setView }: SettingsPageProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cloud Storage modal and auto-sync state
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [autoCloudSync, setAutoCloudSync] = useState(() => cloudStorageService.isAutoSyncEnabled());

  // Dialog state
  const [showClearHistory, setShowClearHistory] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user.id]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await settingsService.getUserSettings(user.id);
      setSettings(data);
      settingsService.applyTheme(data.appearance.theme, data.appearance.nightLight);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Unable to load your settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (newSettings: UserSettings) => {
    try {
      setIsSaving(true);
      setError(null);
      const updated = await settingsService.updateUserSettings(newSettings);
      setSettings(updated);
      settingsService.applyTheme(updated.appearance.theme, updated.appearance.nightLight);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Unable to save your settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    handleSave(newSettings); // Auto-save for toggles/dropdowns
  };

  const updateNestedSetting = <K extends keyof UserSettings, SubK extends keyof UserSettings[K]>(
    category: K,
    key: SubK,
    value: UserSettings[K][SubK]
  ) => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      [category]: {
        ...(settings[category] as object),
        [key]: value
      }
    };
    setSettings(newSettings as UserSettings);
    handleSave(newSettings as UserSettings); // Auto-save
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      const reset = await settingsService.resetSettings(user.id);
      setSettings(reset);
      settingsService.applyTheme(reset.appearance.theme, reset.appearance.nightLight);
      setShowReset(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError("Failed to reset settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = async () => {
    // In a real app, this would call a historyService method
    // For now, we just close the dialog and show a success state
    setShowClearHistory(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col">
        <DashboardNavbar user={user} onLogout={onLogout} onNavigate={setView} currentView="settings" />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
          <div className="h-10 w-48 bg-slate-800 rounded-xl mb-4"></div>
          <div className="h-4 w-96 bg-slate-800/50 rounded-lg mb-10"></div>

          <div className="space-y-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-800">
                <div className="h-6 w-32 bg-slate-800 rounded-lg mb-6"></div>
                <div className="space-y-4">
                  <div className="h-12 w-full bg-slate-800/50 rounded-xl"></div>
                  <div className="h-12 w-full bg-slate-800/50 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col">
        <DashboardNavbar user={user} onLogout={onLogout} onNavigate={setView} currentView="settings" />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
          <div className="text-center space-y-4 p-8 bg-slate-900/60 border border-slate-800 rounded-3xl">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">Unable to load your settings</h2>
            <div className="flex items-center justify-center gap-4">
              <button onClick={loadSettings} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold transition-colors">
                Try Again
              </button>
              <button onClick={() => setView("dashboard")} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold transition-colors">
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      <DashboardNavbar
        user={user}
        onLogout={onLogout}
        onNavigate={setView}
        currentView="settings"
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 relative z-10">

        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-blue-500" /> Settings
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Customize your SentimentAI experience and manage your preferences.
            </p>
          </div>
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-semibold self-start sm:self-center"
              >
                <Check className="w-4 h-4" /> Settings saved successfully
              </motion.div>
            )}
            {error && settings && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-semibold self-start sm:self-center"
              >
                <AlertCircle className="w-4 h-4" /> Unable to save your settings
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-8">

          {/* Appearance Section */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Sun className="w-5 h-5 text-amber-400" /> Appearance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              <button
                onClick={() => updateNestedSetting("appearance", "theme", "light")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                  settings.appearance.theme === "light"
                    ? "bg-blue-600/10 border-blue-500 text-blue-400"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                <Sun className="w-6 h-6" />
                <span className="font-semibold text-sm">Light</span>
              </button>
              <button
                onClick={() => updateNestedSetting("appearance", "theme", "dark")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                  settings.appearance.theme === "dark"
                    ? "bg-slate-600/10 border-slate-500 text-slate-300"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                <Moon className="w-6 h-6" />
                <span className="font-semibold text-sm">Dark</span>
              </button>
              <button
                onClick={() => updateNestedSetting("appearance", "theme", "ocean")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                  settings.appearance.theme === "ocean"
                    ? "bg-sky-600/10 border-sky-500 text-sky-400"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-sky-700 hover:text-sky-300"
                }`}
              >
                <Droplets className="w-6 h-6" />
                <span className="font-semibold text-sm">Ocean</span>
              </button>
              <button
                onClick={() => updateNestedSetting("appearance", "theme", "forest")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                  settings.appearance.theme === "forest"
                    ? "bg-emerald-600/10 border-emerald-500 text-emerald-400"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-emerald-700 hover:text-emerald-300"
                }`}
              >
                <Leaf className="w-6 h-6" />
                <span className="font-semibold text-sm">Forest</span>
              </button>
              <button
                onClick={() => updateNestedSetting("appearance", "theme", "rose")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                  settings.appearance.theme === "rose"
                    ? "bg-rose-600/10 border-rose-500 text-rose-400"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-rose-700 hover:text-rose-300"
                }`}
              >
                <Flame className="w-6 h-6" />
                <span className="font-semibold text-sm">Rose</span>
              </button>
              <button
                onClick={() => updateNestedSetting("appearance", "theme", "amethyst")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                  settings.appearance.theme === "amethyst"
                    ? "bg-violet-600/10 border-violet-500 text-violet-400"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-violet-700 hover:text-violet-300"
                }`}
              >
                <Sparkles className="w-6 h-6" />
                <span className="font-semibold text-sm">Amethyst</span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <ToggleSetting
                title="Night Light (Eye Care)"
                description="Reduce blue light with a warm overlay to prevent eye strain."
                checked={settings.appearance.nightLight}
                onChange={(v) => updateNestedSetting("appearance", "nightLight", v)}
              />
            </div>
          </section>

          {/* Notifications Section */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-rose-400" /> Notifications
            </h2>

            <div className="space-y-4">
              <ToggleSetting
                title="Analysis Complete"
                description="Notify me when an AI analysis is finished."
                checked={settings.notifications.analysisComplete}
                onChange={(v) => updateNestedSetting("notifications", "analysisComplete", v)}
              />
              <ToggleSetting
                title="Report Generated"
                description="Notify me when a report is ready."
                checked={settings.notifications.reportGenerated}
                onChange={(v) => updateNestedSetting("notifications", "reportGenerated", v)}
              />
              <ToggleSetting
                title="Voice Assistant Updates"
                description="Receive updates related to voice features."
                checked={settings.notifications.voiceAssistant}
                onChange={(v) => updateNestedSetting("notifications", "voiceAssistant", v)}
              />
              <ToggleSetting
                title="System Notifications"
                description="Receive important application notifications."
                checked={settings.notifications.system}
                onChange={(v) => updateNestedSetting("notifications", "system", v)}
              />
            </div>
          </section>

          {/* Language Section */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-emerald-400" /> Language
            </h2>
            <div className="max-w-xs relative">
              <select
                value={settings.language}
                onChange={(e) => updateSetting("language", e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="en">English</option>
                {/* Future placeholders */}
                <option value="hi" disabled>Hindi (Coming Soon)</option>
                <option value="te" disabled>Telugu (Coming Soon)</option>
                <option value="ta" disabled>Tamil (Coming Soon)</option>
                <option value="es" disabled>Spanish (Coming Soon)</option>
                <option value="fr" disabled>French (Coming Soon)</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </section>

          {/* Automatic Cloud Storage & Real-Time Sync */}
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-400" /> Automatic Cloud Storage
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Persist all your analyses, transcripts, and metadata continuously in Google Cloud Firestore and Storage.
                </p>
              </div>
              <button
                type="button"
                id="btn-settings-open-cloud-hub"
                onClick={() => setIsCloudModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-sm"
              >
                <Cloud className="w-4 h-4" /> Open Cloud Storage Hub
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Auto-Store Analyses & Data</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Automatically synchronize every new analysis session and payload to Cloud Storage upon completion.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoCloudSync}
                onClick={() => {
                  const next = !autoCloudSync;
                  setAutoCloudSync(next);
                  cloudStorageService.setAutoSyncEnabled(next);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${
                  autoCloudSync ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                    autoCloudSync ? "translate-x-2.5" : "-translate-x-2.5"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Advanced Privacy & Security Center */}
          <section className="pt-4">
            <PrivacyCenter user={user} onLogout={onLogout} onDataPurged={(type) => console.log('Data purged:', type)} />
          </section>

          {/* Reset Preferences */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setShowReset(true)}
              className="px-6 py-3 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset Preferences
            </button>
          </div>

        </div>
      </main>

      {/* Reset Settings Dialog */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowReset(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Reset your preferences?</h3>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              This will restore your SentimentAI settings to their default values. Theme, notifications, and privacy options will be reset.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                onClick={() => setShowReset(false)}
                className="w-full sm:flex-1 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="w-full sm:flex-1 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {isSaving ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Storage Hub Modal */}
      <CloudStorageHubModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />

    </div>
  );
}

// Helper Component for Settings Toggles
function ToggleSetting({ title, description, checked, onChange }: { title: string, description: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-950/30 border border-slate-800/50 hover:border-slate-700 transition-colors cursor-pointer" onClick={() => onChange(!checked)}>
      <div className="space-y-1">
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-xs text-slate-400 leading-relaxed">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
          checked ? 'bg-blue-600' : 'bg-slate-700'
        }`}
      >
        <span className="sr-only">Enable {title}</span>
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
            checked ? 'translate-x-2.5' : '-translate-x-2.5'
          }`}
        />
      </button>
    </div>
  );
}
