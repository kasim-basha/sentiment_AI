import { UserPrivacySettings, UserDataExportSummary } from '../types';

export const privacyService = {
  getPrivacySettings: async (userId: string): Promise<UserPrivacySettings> => {
    try {
      const res = await fetch("/api/settings/privacy", {
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.privacy) return data.privacy;
      }
    } catch {
      // fallback
    }

    const local = localStorage.getItem(`sentiment_ai_privacy_${userId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // fallback to default
      }
    }

    return {
      saveAnalysisHistory: true,
      autoDeleteHistory: "never",
      saveReports: true,
      personalizedExperience: true,
      saveClarityConversations: true,
      saveGoalTracking: true,
      saveSearchHistory: true,
      communityVisibility: "private"
    };
  },

  updatePrivacySettings: async (userId: string, privacy: Partial<UserPrivacySettings>): Promise<UserPrivacySettings> => {
    try {
      const res = await fetch("/api/settings/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(privacy)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.privacy) {
          localStorage.setItem(`sentiment_ai_privacy_${userId}`, JSON.stringify(data.privacy));
          return data.privacy;
        }
      }
    } catch {
      // local fallback
    }

    const current = await privacyService.getPrivacySettings(userId);
    const updated = { ...current, ...privacy };
    localStorage.setItem(`sentiment_ai_privacy_${userId}`, JSON.stringify(updated));
    return updated;
  },

  exportUserData: async (): Promise<UserDataExportSummary> => {
    const res = await fetch("/api/data/export", {
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to export user data.");
    }
    const data = await res.json();
    return data.data;
  },

  deleteAnalyses: async (): Promise<{ deletedCount: number; message: string }> => {
    const res = await fetch("/api/data/analyses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to delete analyses.");
    }
    return res.json();
  },

  deleteReports: async (): Promise<{ deletedCount: number; message: string }> => {
    const res = await fetch("/api/data/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to delete reports.");
    }
    return res.json();
  },

  deleteClarity: async (): Promise<{ conversationsCount: number; messagesCount: number; message: string }> => {
    const res = await fetch("/api/data/clarity", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to delete Clarity assistant conversations.");
    }
    return res.json();
  },

  deleteSearchHistory: async (): Promise<{ deletedCount: number; message: string }> => {
    const res = await fetch("/api/data/search-history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to delete search history.");
    }
    return res.json();
  },

  deleteGoals: async (): Promise<{ deletedCount: number; message: string }> => {
    const res = await fetch("/api/data/goals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to delete goals.");
    }
    return res.json();
  },

  deleteAccount: async (confirmation: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ confirmation })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Failed to delete account.");
    }
    return res.json();
  }
};
