import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { User, UserSettings } from "../types";

export interface StoredAnalysisRecord {
  id: string;
  userId: string;
  modality: "text" | "image" | "video" | "audio" | "document";
  sentiment: string;
  score: number;
  emotions?: Record<string, number>;
  summary?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export const firestoreService = {
  /**
   * Save or update user profile in Firestore
   */
  saveUserProfile: async (user: User): Promise<void> => {
    try {
      const userRef = doc(db, "users", user.id);
      const payload: Record<string, any> = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (user.avatar) {
        payload.avatar = user.avatar;
      }
      await setDoc(userRef, payload, { merge: true });
    } catch (err) {
      console.warn("[firestoreService.saveUserProfile] Fallback warning:", err);
    }
  },

  /**
   * Get user profile from Firestore
   */
  getUserProfile: async (userId: string): Promise<User | null> => {
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: data.id || userId,
          email: data.email || "",
          name: data.name || "User",
          role: data.role || "user",
          status: data.status || "active",
          avatar: data.avatar || undefined
        };
      }
      return null;
    } catch (err) {
      console.warn("[firestoreService.getUserProfile] Fallback warning:", err);
      return null;
    }
  },

  /**
   * Get analyses for a user in the last X days
   */
  getUserAnalysesLastDays: async (userId: string, days: number = 7): Promise<StoredAnalysisRecord[]> => {
    try {
      const d = new Date();
      d.setDate(d.getDate() - days);
      const q = query(
        collection(db, "analyses"),
        where("userId", "==", userId),
        where("createdAt", ">=", d.toISOString()),
        orderBy("createdAt", "asc")
      );
      const snap = await getDocs(q);
      const list: StoredAnalysisRecord[] = [];
      snap.forEach((d) => {
        list.push(d.data() as StoredAnalysisRecord);
      });
      return list;
    } catch (err) {
      console.warn("[firestoreService.getUserAnalysesLastDays] Fallback warning:", err);
      return [];
    }
  },

  /**
   * Save an analysis record to Firestore
   */
  saveAnalysisRecord: async (record: StoredAnalysisRecord): Promise<string> => {
    try {
      const docRef = doc(db, "analyses", record.id);
      await setDoc(docRef, {
        ...record,
        updatedAt: new Date().toISOString()
      });
      return record.id;
    } catch (err) {
      console.warn("[firestoreService.saveAnalysisRecord] Fallback warning:", err);
      return record.id;
    }
  },

  /**
   * Get all analyses saved for a user
   */
  getUserAnalyses: async (userId: string, maxItems: number = 20): Promise<StoredAnalysisRecord[]> => {
    try {
      const q = query(
        collection(db, "analyses"),
        where("userId", "==", userId),
        limit(maxItems)
      );
      const snap = await getDocs(q);
      const list: StoredAnalysisRecord[] = [];
      snap.forEach((d) => {
        list.push(d.data() as StoredAnalysisRecord);
      });
      return list;
    } catch (err) {
      console.warn("[firestoreService.getUserAnalyses] Fallback warning:", err);
      return [];
    }
  },

  /**
   * Save a chat thread to Firestore
   */
  saveChatThread: async (userId: string, thread: { id: string; title: string; persona: string; messages: any[] }): Promise<void> => {
    try {
      const threadRef = doc(db, "chat_threads", thread.id);
      await setDoc(threadRef, {
        id: thread.id,
        userId,
        title: thread.title,
        persona: thread.persona,
        messages: thread.messages,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("[firestoreService.saveChatThread] Fallback warning:", err);
    }
  },

  /**
   * Get user chat threads from Firestore
   */
  getUserChatThreads: async (userId: string): Promise<any[]> => {
    try {
      const q = query(
        collection(db, "chat_threads"),
        where("userId", "==", userId),
        limit(25)
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => {
        list.push(d.data());
      });
      return list;
    } catch (err) {
      console.warn("[firestoreService.getUserChatThreads] Fallback warning:", err);
      return [];
    }
  }
};
