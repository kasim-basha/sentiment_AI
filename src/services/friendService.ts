import { authService } from "./authService";
import { FriendUser, FriendRequestItem, BlockedUserItem } from "../types";

function getHeaders(): HeadersInit {
  const token = authService.getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const friendService = {
  // Search users
  searchUsers: async (query: string): Promise<FriendUser[]> => {
    try {
      const res = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.success ? data.users : [];
    } catch {
      return [];
    }
  },

  // Get friends list
  getFriends: async (): Promise<FriendUser[]> => {
    try {
      const res = await fetch("/api/friends", { headers: getHeaders() });
      const data = await res.json();
      return data.success ? data.friends : [];
    } catch {
      return [];
    }
  },

  // Remove a friend
  removeFriend: async (friendId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/friends/${friendId}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // Send a friend request
  sendRequest: async (receiverId: string): Promise<{ success: boolean; message?: string; request?: FriendRequestItem }> => {
    try {
      const res = await fetch("/api/friends/requests", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ receiverId })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // Get friend requests (incoming & outgoing)
  getRequests: async (): Promise<{ incoming: FriendRequestItem[]; outgoing: FriendRequestItem[] }> => {
    try {
      const res = await fetch("/api/friends/requests", { headers: getHeaders() });
      const data = await res.json();
      return data.success ? { incoming: data.incoming, outgoing: data.outgoing } : { incoming: [], outgoing: [] };
    } catch {
      return { incoming: [], outgoing: [] };
    }
  },

  // Accept a friend request
  acceptRequest: async (requestId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/friends/requests/${requestId}/accept`, {
        method: "POST",
        headers: getHeaders()
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // Reject a friend request
  rejectRequest: async (requestId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/friends/requests/${requestId}/reject`, {
        method: "POST",
        headers: getHeaders()
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // Cancel an outgoing friend request
  cancelRequest: async (requestId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // Block a user
  blockUser: async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/blocks/${userId}`, {
        method: "POST",
        headers: getHeaders()
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // Unblock a user
  unblockUser: async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/blocks/${userId}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // Get blocked users
  getBlockedUsers: async (): Promise<BlockedUserItem[]> => {
    try {
      const res = await fetch("/api/blocks", { headers: getHeaders() });
      const data = await res.json();
      return data.success ? data.blocks : [];
    } catch {
      return [];
    }
  }
};
