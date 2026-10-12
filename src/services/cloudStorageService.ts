/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc
} from "firebase/firestore";
import {
  ref,
  uploadString,
  getDownloadURL,
  listAll,
  deleteObject
} from "firebase/storage";
import { db, storage, auth } from "../lib/firebase";
import { HistoryRecord } from "../types";
import firebaseConfigData from "../../firebase-applet-config.json";

export type CloudSyncStatus = "synced" | "syncing" | "offline" | "error" | "idle";

export interface CloudStorageMetadata {
  provider: string;
  databaseId: string;
  storageBucket: string;
  autoSyncEnabled: boolean;
  totalCloudRecords: number;
  lastSyncedAt: string | null;
  status: CloudSyncStatus;
  statusMessage: string;
}

export interface CloudStoredItem {
  id: string;
  userId: string;
  title: string;
  modality: string;
  sentiment: string;
  score: number;
  confidence?: string;
  dominantEmotion?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  cloudStorageUrl?: string;
  fullPayload?: any;
}

const PREF_AUTO_SYNC_KEY = "sentimentai_cloud_storage_auto_sync";
const LAST_SYNC_KEY = "sentimentai_cloud_storage_last_sync";
const PENDING_QUEUE_KEY = "sentimentai_cloud_storage_pending_queue";

type StatusListener = (status: CloudSyncStatus, message: string) => void;
const statusListeners: Set<StatusListener> = new Set();

let currentStatus: CloudSyncStatus = "synced";
let currentStatusMessage = "Automatic Cloud Storage active";
let autoSyncInterval: any = null;

function notifyListeners(status: CloudSyncStatus, message: string) {
  currentStatus = status;
  currentStatusMessage = message;
  statusListeners.forEach((listener) => {
    try {
      listener(status, message);
    } catch (e) {
      console.warn("[cloudStorageService] Listener error:", e);
    }
  });
}

function getActiveUserId(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  try {
    const raw = localStorage.getItem("sentimentai_user_session");
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.id) return user.id;
    }
  } catch {}
  return "user_default";
}

export const cloudStorageService = {
  /**
   * Subscribe to real-time cloud storage sync status changes
   */
  onSyncStatusChange: (callback: StatusListener): (() => void) => {
    statusListeners.add(callback);
    callback(currentStatus, currentStatusMessage);
    return () => {
      statusListeners.delete(callback);
    };
  },

  /**
   * Get current sync status
   */
  getStatus: (): CloudSyncStatus => currentStatus,
  getStatusMessage: (): string => currentStatusMessage,

  /**
   * Check if automatic cloud storage is enabled (defaults to true)
   */
  isAutoSyncEnabled: (): boolean => {
    try {
      const val = localStorage.getItem(PREF_AUTO_SYNC_KEY);
      return val === null ? true : val === "true";
    } catch {
      return true;
    }
  },

  /**
   * Toggle automatic cloud storage
   */
  setAutoSyncEnabled: (enabled: boolean): void => {
    try {
      localStorage.setItem(PREF_AUTO_SYNC_KEY, String(enabled));
      if (enabled) {
        cloudStorageService.startBackgroundSync();
        cloudStorageService.flushPendingQueue().catch(() => {});
        notifyListeners("synced", "Automatic Cloud Storage enabled");
      } else {
        cloudStorageService.stopBackgroundSync();
        notifyListeners("idle", "Automatic Cloud Storage paused");
      }
    } catch (err) {
      console.warn("[cloudStorageService] Error saving auto-sync setting:", err);
    }
  },

  /**
   * Get comprehensive cloud storage metadata
   */
  getMetadata: async (): Promise<CloudStorageMetadata> => {
    let totalRecords = 0;
    try {
      const userId = getActiveUserId();
      const res = await fetch(`/api/cloud-storage/status?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        totalRecords = json.totalRecords || 0;
      }
    } catch {}

    const lastSynced = localStorage.getItem(LAST_SYNC_KEY) || new Date().toISOString();

    return {
      provider: "Google Cloud Firestore & Firebase Storage",
      databaseId: firebaseConfigData.firestoreDatabaseId || "ai-studio-sentimentai-2876c5c3-70c1-4d85-a133-1e01334c6eec",
      storageBucket: firebaseConfigData.storageBucket || "witty-joy-gmn89.firebasestorage.app",
      autoSyncEnabled: cloudStorageService.isAutoSyncEnabled(),
      totalCloudRecords: totalRecords,
      lastSyncedAt: lastSynced,
      status: currentStatus,
      statusMessage: currentStatusMessage
    };
  },

  /**
   * Automatically store an analysis record to Cloud Storage & Firestore
   */
  autoStoreRecord: async (record: HistoryRecord): Promise<{ success: boolean; cloudId: string }> => {
    if (!cloudStorageService.isAutoSyncEnabled()) {
      return { success: false, cloudId: record.analysisId };
    }

    notifyListeners("syncing", `Auto-storing "${record.title.slice(0, 24)}..." to cloud`);
    const userId = record.userId || getActiveUserId();
    const cloudId = record.analysisId;

    const cloudItem: CloudStoredItem = {
      id: cloudId,
      userId,
      title: record.title || "Sentiment Analysis",
      modality: (record.inputTypes && record.inputTypes[0]) || "text",
      sentiment: record.overallSentiment?.label || "Neutral",
      score: record.overallSentiment?.score ?? 0.5,
      confidence: record.overallSentiment?.confidence || "Medium",
      dominantEmotion: record.dominantEmotion || "Reflective",
      summary: record.summary || "",
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fullPayload: record
    };

    let firestoreSuccess = false;
    let backendSuccess = false;

    // 1. Direct Firestore write
    try {
      const docRef = doc(db, "analyses", cloudId);
      await setDoc(docRef, {
        id: cloudId,
        userId,
        modality: cloudItem.modality,
        sentiment: cloudItem.sentiment,
        score: cloudItem.score,
        emotions: record.fullResult?.emotions || {},
        summary: cloudItem.summary,
        createdAt: cloudItem.createdAt,
        updatedAt: cloudItem.updatedAt,
        metadata: {
          title: cloudItem.title,
          dominantEmotion: cloudItem.dominantEmotion,
          confidence: cloudItem.confidence,
          fileNames: record.fileNames || []
        }
      }, { merge: true });
      firestoreSuccess = true;
    } catch (fbErr: any) {
      console.warn("[cloudStorageService] Firestore direct auto-save note:", fbErr?.message);
    }

    // 2. High-reliability Backend Cloud Storage route
    try {
      const resp = await fetch("/api/cloud-storage/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, record })
      });
      if (resp.ok) {
        backendSuccess = true;
      }
    } catch (apiErr: any) {
      console.warn("[cloudStorageService] Backend cloud sync note:", apiErr?.message);
    }

    // 3. Update sync state & pending queue
    const isSaved = firestoreSuccess || backendSuccess;
    if (isSaved) {
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      notifyListeners("synced", `Saved to Cloud Storage (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })})`);
      return { success: true, cloudId };
    } else {
      // Queue offline for subsequent retry
      cloudStorageService.enqueuePending(record);
      notifyListeners("offline", "Stored locally • Queued for cloud auto-sync");
      return { success: false, cloudId };
    }
  },

  /**
   * Queue record for background retry when network reconnects
   */
  enqueuePending: (record: HistoryRecord): void => {
    try {
      const raw = localStorage.getItem(PENDING_QUEUE_KEY);
      const queue: HistoryRecord[] = raw ? JSON.parse(raw) : [];
      if (!queue.some(r => r.analysisId === record.analysisId)) {
        queue.push(record);
        localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue.slice(-50)));
      }
    } catch {}
  },

  /**
   * Flush pending queue to cloud
   */
  flushPendingQueue: async (): Promise<number> => {
    try {
      const raw = localStorage.getItem(PENDING_QUEUE_KEY);
      if (!raw) return 0;
      const queue: HistoryRecord[] = JSON.parse(raw);
      if (queue.length === 0) return 0;

      notifyListeners("syncing", `Syncing ${queue.length} pending records to cloud...`);
      const userId = getActiveUserId();

      const resp = await fetch("/api/cloud-storage/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, records: queue })
      });

      if (resp.ok) {
        localStorage.removeItem(PENDING_QUEUE_KEY);
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
        notifyListeners("synced", `All pending records synced to Cloud Storage`);
        return queue.length;
      }
      return 0;
    } catch {
      return 0;
    }
  },

  /**
   * Retrieve all cloud-stored records for the active user
   */
  getCloudRecords: async (): Promise<CloudStoredItem[]> => {
    const userId = getActiveUserId();
    const items: CloudStoredItem[] = [];

    // Attempt backend cloud storage endpoint
    try {
      const res = await fetch(`/api/cloud-storage/records?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.records)) {
          data.records.forEach((rec: any) => {
            items.push({
              id: rec.id || rec.analysisId,
              userId: rec.userId || userId,
              title: rec.title || "Cloud Stored Analysis",
              modality: rec.modality || rec.inputTypes?.[0] || "text",
              sentiment: rec.sentiment || rec.overallSentiment?.label || "Neutral",
              score: rec.score ?? rec.overallSentiment?.score ?? 0.5,
              confidence: rec.confidence || "High",
              dominantEmotion: rec.dominantEmotion || "Reflective",
              summary: rec.summary || "",
              createdAt: rec.createdAt || new Date().toISOString(),
              updatedAt: rec.updatedAt || new Date().toISOString(),
              fullPayload: rec
            });
          });
        }
      }
    } catch (e) {
      console.warn("[cloudStorageService.getCloudRecords] Backend fetch warning:", e);
    }

    // Also query Firestore directly if authenticated or has records
    try {
      const q = query(
        collection(db, "analyses"),
        where("userId", "==", userId),
        limit(50)
      );
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const dat = d.data();
        if (!items.some(i => i.id === d.id)) {
          items.push({
            id: d.id,
            userId: dat.userId || userId,
            title: dat.metadata?.title || dat.summary?.slice(0, 30) || "Cloud Record",
            modality: dat.modality || "text",
            sentiment: dat.sentiment || "Neutral",
            score: dat.score ?? 0.5,
            confidence: dat.metadata?.confidence || "High",
            dominantEmotion: dat.metadata?.dominantEmotion || "Reflective",
            summary: dat.summary || "",
            createdAt: dat.createdAt || new Date().toISOString(),
            updatedAt: dat.updatedAt || new Date().toISOString(),
            fullPayload: dat
          });
        }
      });
    } catch (fsErr) {
      // Ignored if permissions or offline
    }

    return items;
  },

  /**
   * Force sync all local records to Cloud Storage right now
   */
  forceSyncAll: async (localRecords: HistoryRecord[]): Promise<{ success: boolean; count: number; message: string }> => {
    notifyListeners("syncing", `Synchronizing ${localRecords.length} records to Cloud Storage...`);
    const userId = getActiveUserId();

    try {
      const resp = await fetch("/api/cloud-storage/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, records: localRecords })
      });

      if (!resp.ok) {
        throw new Error(`Sync failed with status: ${resp.status}`);
      }

      const json = await resp.json();
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      notifyListeners("synced", `Successfully synced ${localRecords.length} records to Cloud Storage`);
      return {
        success: true,
        count: json.syncedCount || localRecords.length,
        message: `Synced ${json.syncedCount || localRecords.length} records to Google Cloud Storage.`
      };
    } catch (err: any) {
      notifyListeners("error", `Sync warning: ${err?.message || "Check network connection"}`);
      return {
        success: false,
        count: 0,
        message: err?.message || "Failed to force sync records."
      };
    }
  },

  /**
   * Pull and restore analyses from Cloud Storage into local workspace
   */
  restoreFromCloud: async (): Promise<{ restoredCount: number; records: HistoryRecord[] }> => {
    notifyListeners("syncing", "Restoring analyses from Cloud Storage...");
    const cloudItems = await cloudStorageService.getCloudRecords();

    const restoredRecords: HistoryRecord[] = cloudItems.map(item => {
      if (item.fullPayload?.analysisId) {
        return item.fullPayload as HistoryRecord;
      }
      return {
        analysisId: item.id,
        userId: item.userId,
        title: item.title,
        createdAt: item.createdAt,
        status: "completed",
        inputSummary: {
          textCount: item.modality === "text" ? 1 : 0,
          imageCount: item.modality === "image" ? 1 : 0,
          videoCount: item.modality === "video" ? 1 : 0,
          totalFiles: item.fullPayload?.fileNames?.length || 0
        },
        fileNames: item.fullPayload?.fileNames || [],
        inputTypes: [item.modality as any],
        overallSentiment: {
          label: (item.sentiment as any) || "Neutral",
          score: item.score,
          confidence: (item.confidence as any) || "High"
        },
        dominantEmotion: item.dominantEmotion || "Reflective",
        summary: item.summary || "",
        fullResult: item.fullPayload
      };
    });

    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    notifyListeners("synced", `Restored ${restoredRecords.length} records from Cloud Storage`);
    return {
      restoredCount: restoredRecords.length,
      records: restoredRecords
    };
  },

  /**
   * Upload binary file or base64 to Firebase Cloud Storage bucket
   */
  uploadMediaToStorage: async (
    fileName: string,
    dataUrlOrBase64: string,
    contentType: string = "application/octet-stream"
  ): Promise<{ success: boolean; storageUrl?: string; storagePath?: string }> => {
    try {
      const userId = getActiveUserId();
      const storagePath = `users/${userId}/media/${Date.now()}_${fileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadString(storageRef, dataUrlOrBase64, "data_url", { contentType });
      const downloadUrl = await getDownloadURL(storageRef);

      return {
        success: true,
        storageUrl: downloadUrl,
        storagePath
      };
    } catch (err: any) {
      console.warn("[cloudStorageService.uploadMediaToStorage] Note:", err?.message);
      return {
        success: false
      };
    }
  },

  /**
   * Start automatic background synchronization loop
   */
  startBackgroundSync: () => {
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    // Background sync check every 45 seconds
    autoSyncInterval = setInterval(() => {
      if (cloudStorageService.isAutoSyncEnabled()) {
        cloudStorageService.flushPendingQueue().catch(() => {});
      }
    }, 45000);
  },

  /**
   * Stop background synchronization loop
   */
  stopBackgroundSync: () => {
    if (autoSyncInterval) {
      clearInterval(autoSyncInterval);
      autoSyncInterval = null;
    }
  }
};

// Initialize background sync immediately
if (typeof window !== "undefined") {
  cloudStorageService.startBackgroundSync();
}
