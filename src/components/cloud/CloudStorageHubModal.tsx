import { useState, useEffect } from "react";
import {
  Cloud,
  Database,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  UploadCloud,
  ArrowDownToLine,
  ShieldCheck,
  X,
  Sparkles,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Clock,
  Layers,
  Check
} from "lucide-react";
import { cloudStorageService, CloudStorageMetadata, CloudStoredItem, CloudSyncStatus } from "../../services/cloudStorageService";
import { historyService } from "../../services/historyService";
import { HistoryRecord } from "../../types";

interface CloudStorageHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordsUpdated?: () => void;
}

export function CloudStorageHubModal({ isOpen, onClose, onRecordsUpdated }: CloudStorageHubModalProps) {
  const [metadata, setMetadata] = useState<CloudStorageMetadata | null>(null);
  const [cloudRecords, setCloudRecords] = useState<CloudStoredItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>("synced");
  const [statusMessage, setStatusMessage] = useState<string>("Automatic Cloud Storage active");
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CloudStoredItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      const meta = await cloudStorageService.getMetadata();
      setMetadata(meta);
      setAutoSync(meta.autoSyncEnabled);
      setSyncStatus(meta.status);
      setStatusMessage(meta.statusMessage);

      const records = await cloudStorageService.getCloudRecords();
      setCloudRecords(records);
    } catch (err: any) {
      console.warn("[CloudStorageHubModal] Load data error:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      const unsubscribe = cloudStorageService.onSyncStatusChange((status, message) => {
        setSyncStatus(status);
        setStatusMessage(message);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleAutoSync = () => {
    const next = !autoSync;
    setAutoSync(next);
    cloudStorageService.setAutoSyncEnabled(next);
    setActionSuccess(next ? "Automatic Cloud Storage enabled." : "Automatic Cloud Storage paused.");
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const localRecords = await historyService.getAnalyses();
      const res = await cloudStorageService.forceSyncAll(localRecords);
      if (res.success) {
        setActionSuccess(`Synced ${res.count} records directly to Cloud Storage.`);
        await loadData();
        if (onRecordsUpdated) onRecordsUpdated();
      } else {
        setActionError(res.message);
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to force sync records.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleRestoreFromCloud = async () => {
    setIsSyncing(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await cloudStorageService.restoreFromCloud();
      // Save pulled records into local history store
      for (const rec of res.records) {
        await historyService.saveAnalysis(rec);
      }
      setActionSuccess(`Restored ${res.restoredCount} analysis records from Cloud Storage.`);
      await loadData();
      if (onRecordsUpdated) onRecordsUpdated();
    } catch (err: any) {
      setActionError(err?.message || "Failed to restore from Cloud Storage.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleDownloadBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      provider: "Google Cloud Firestore & Firebase Storage",
      databaseId: metadata?.databaseId,
      storageBucket: metadata?.storageBucket,
      totalRecords: cloudRecords.length,
      records: cloudRecords
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `SentimentAI_Cloud_Storage_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    setActionSuccess("Cloud storage archive downloaded.");
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const filteredRecords = cloudRecords.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.sentiment.toLowerCase().includes(q) ||
      r.modality.toLowerCase().includes(q) ||
      (r.summary && r.summary.toLowerCase().includes(q))
    );
  });

  const getModalityIcon = (modality: string) => {
    switch (modality?.toLowerCase()) {
      case "video":
        return <Video className="w-3.5 h-3.5 text-rose-400" />;
      case "audio":
        return <Music className="w-3.5 h-3.5 text-amber-400" />;
      case "image":
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div id="modal-cloud-storage-hub" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Automatic Cloud Storage</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous background persistence powered by Google Cloud Firestore & Firebase Storage
              </p>
            </div>
          </div>
          <button
            id="btn-close-cloud-storage-hub"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Notifications */}
          {actionSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Cloud Infrastructure & Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Auto-Sync Switch Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <UploadCloud className="w-4 h-4 text-blue-400" />
                  <span>Auto-Store Data</span>
                </div>
                <button
                  type="button"
                  id="toggle-auto-cloud-storage"
                  onClick={handleToggleAutoSync}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    autoSync ? "bg-blue-600 justify-end" : "bg-slate-700 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-400">
                  {autoSync
                    ? "Analyses & files are automatically stored in the cloud as soon as generated."
                    : "Automatic storage paused. Manual sync required."}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Status: {statusMessage}</span>
                </div>
              </div>
            </div>

            {/* Cloud Firestore Database Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Cloud Database ID</span>
              </div>
              <div className="mt-2">
                <p className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded truncate" title={metadata?.databaseId}>
                  {metadata?.databaseId || "ai-studio-sentimentai-2876c5c3-..."}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Google Cloud Firestore • Active Multi-Region
                </p>
              </div>
            </div>

            {/* Storage Bucket & Telemetry Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>Cloud Storage Bucket</span>
              </div>
              <div className="mt-2">
                <p className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded truncate" title={metadata?.storageBucket}>
                  {metadata?.storageBucket || "witty-joy-gmn89.firebasestorage.app"}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Cloud Records:</span>
                  <span className="font-semibold text-white">{cloudRecords.length} stored</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-cloud-force-sync"
                disabled={isSyncing}
                onClick={handleForceSync}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Sync Now</span>
              </button>

              <button
                type="button"
                id="btn-cloud-restore"
                disabled={isSyncing}
                onClick={handleRestoreFromCloud}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-400" />
                <span>Restore from Cloud</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-download-cloud-backup"
                onClick={handleDownloadBackup}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700/80 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Cloud JSON</span>
              </button>
            </div>
          </div>

          {/* Cloud Stored Records Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">Records Stored in Cloud ({filteredRecords.length})</h3>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cloud records..."
                className="w-48 sm:w-64 px-3 py-1 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                <Cloud className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No cloud storage records found yet</p>
                <p className="text-[11px] text-slate-500">
                  Any analysis performed in the app is automatically stored in Cloud Storage. Click "Sync Now" to push existing records.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredRecords.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className="p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0">
                        {getModalityIcon(item.modality)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </p>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider ${
                            item.sentiment === "Positive"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.sentiment === "Negative"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}>
                            {item.sentiment}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.summary || `Analysis ID: ${item.id}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div className="hidden sm:block">
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                          <Check className="w-3 h-3" />
                          <span>Cloud Stored</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Record Inspection Modal */}
          {selectedRecord && (
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cloud Record Payload: {selectedRecord.id}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 max-h-48 overflow-auto border border-slate-800">
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Automatic cloud backups enabled for continuous resilience.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
