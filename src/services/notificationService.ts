import { authService } from "./authService";
import { NotificationItem, UnreadCounts } from "../types";

function getHeaders(): HeadersInit {
  const token = authService.getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    try {
      const res = await fetch("/api/notifications", { headers: getHeaders() });
      const data = await res.json();
      return data.success ? data.notifications : [];
    } catch {
      return [];
    }
  },

  getUnreadCounts: async (): Promise<UnreadCounts> => {
    try {
      const res = await fetch("/api/notifications/counts", { headers: getHeaders() });
      const data = await res.json();
      return data.success
        ? data.counts
        : { friendRequests: 0, unreadMessages: 0, missedCalls: 0, notifications: 0, total: 0 };
    } catch {
      return { friendRequests: 0, unreadMessages: 0, missedCalls: 0, notifications: 0, total: 0 };
    }
  },

  markAsRead: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: getHeaders()
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  },

  markAllAsRead: async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: getHeaders()
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }
};
