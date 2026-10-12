import { authService } from "./authService";
import {
  ClarityConversation,
  ClarityMessage,
  ClarityExplanationType,
  ClarityQuickExplainRequest,
  ClarityQuickExplainResponse
} from "../types";

class ClarityAssistantServiceClient {
  private getHeaders(): HeadersInit {
    const token = authService.getStoredToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  /**
   * Create a new clarity assistant conversation for an analysis session
   */
  async createConversation(params: {
    analysisId: string;
    title?: string;
    initialQuestion?: string;
    mode?: ClarityExplanationType;
    language?: string;
  }): Promise<ClarityConversation> {
    const res = await fetch("/api/clarity/conversations", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to create Clarity Assistant conversation.");
    }
    return data.conversation;
  }

  /**
   * List clarity conversations for the current user, optionally filtered by analysisId
   */
  async getConversations(analysisId?: string): Promise<ClarityConversation[]> {
    const params = new URLSearchParams();
    if (analysisId) params.set("analysisId", analysisId);

    const url = `/api/clarity/conversations${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to fetch conversations.");
    }
    return data.conversations || [];
  }

  /**
   * Get single conversation with message history
   */
  async getConversation(conversationId: string): Promise<ClarityConversation> {
    const res = await fetch(`/api/clarity/conversations/${conversationId}`, {
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to fetch conversation details.");
    }
    return data.conversation;
  }

  /**
   * Send a question to the clarity assistant
   */
  async sendMessage(params: {
    conversationId: string;
    content: string;
    mode?: ClarityExplanationType;
    section?: string;
    language?: string;
  }): Promise<{ userMessage: ClarityMessage; assistantMessage: ClarityMessage }> {
    const res = await fetch(`/api/clarity/conversations/${params.conversationId}/messages`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        content: params.content,
        mode: params.mode || "general",
        section: params.section,
        language: params.language || "English"
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to send message to Clarity Assistant.");
    }
    return {
      userMessage: data.userMessage,
      assistantMessage: data.assistantMessage
    };
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const res = await fetch(`/api/clarity/conversations/${conversationId}`, {
      method: "DELETE",
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to delete conversation.");
    }
  }

  /**
   * Quick one-shot explanation without opening a long conversation
   */
  async quickExplain(params: ClarityQuickExplainRequest): Promise<ClarityQuickExplainResponse["explanation"]> {
    const res = await fetch("/api/clarity/explain", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to generate quick explanation.");
    }
    return data.explanation;
  }
}

export const clarityAssistantService = new ClarityAssistantServiceClient();
