import { authService } from "./authService";
import { ConversationItem, ChatMessageItem } from "../types";

function getHeaders(): HeadersInit {
  const token = authService.getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const chatService = {
  // Get conversations
  getConversations: async (): Promise<ConversationItem[]> => {
    try {
      const res = await fetch("/api/conversations", { headers: getHeaders() });
      const data = await res.json();
      return data.success ? data.conversations : [];
    } catch {
      return [];
    }
  },

  // Start / Open a conversation with a friend
  createOrGetConversation: async (friendId: string): Promise<ConversationItem | null> => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ friendId })
      });
      const data = await res.json();
      return data.success ? data.conversation : null;
    } catch {
      return null;
    }
  },

  // Get messages for conversation
  getMessages: async (conversationId: string, page: number = 1, limit: number = 50): Promise<{ messages: ChatMessageItem[]; total: number; totalPages: number }> => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.success ? { messages: data.messages, total: data.total, totalPages: data.totalPages } : { messages: [], total: 0, totalPages: 1 };
    } catch {
      return { messages: [], total: 0, totalPages: 1 };
    }
  },

  // Send message
  sendMessage: async (conversationId: string, content: string): Promise<ChatMessageItem | null> => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      return data.success ? data.message : null;
    } catch {
      return null;
    }
  },

  // Mark message as read
  markAsRead: async (messageId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: "PATCH",
        headers: getHeaders()
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  },

  // Delete message
  deleteMessage: async (messageId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }
};
