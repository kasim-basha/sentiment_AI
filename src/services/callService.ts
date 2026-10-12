import { authService } from "./authService";
import { CallSessionItem, CallType } from "../types";

function getHeaders(): HeadersInit {
  const token = authService.getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const callService = {
  // Initiate a call
  initiateCall: async (receiverId: string, type: CallType): Promise<CallSessionItem | null> => {
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ receiverId, type })
      });
      const data = await res.json();
      return data.success ? data.session : null;
    } catch {
      return null;
    }
  },

  // Get call history
  getCallHistory: async (): Promise<CallSessionItem[]> => {
    try {
      const res = await fetch("/api/calls", { headers: getHeaders() });
      const data = await res.json();
      return data.success ? data.calls : [];
    } catch {
      return [];
    }
  },

  // Get active session
  getCallSession: async (callId: string): Promise<CallSessionItem | null> => {
    try {
      const res = await fetch(`/api/calls/${callId}`, { headers: getHeaders() });
      const data = await res.json();
      return data.success ? data.session : null;
    } catch {
      return null;
    }
  },

  // Accept call
  acceptCall: async (callId: string): Promise<CallSessionItem | null> => {
    try {
      const res = await fetch(`/api/calls/${callId}/accept`, {
        method: "POST",
        headers: getHeaders()
      });
      const data = await res.json();
      return data.success ? data.session : null;
    } catch {
      return null;
    }
  },

  // Reject call
  rejectCall: async (callId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/calls/${callId}/reject`, {
        method: "POST",
        headers: getHeaders()
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  },

  // End call
  endCall: async (callId: string): Promise<CallSessionItem | null> => {
    try {
      const res = await fetch(`/api/calls/${callId}/end`, {
        method: "POST",
        headers: getHeaders()
      });
      const data = await res.json();
      return data.success ? data.session : null;
    } catch {
      return null;
    }
  },

  // Send signaling data
  sendSignal: async (callId: string, signalType: string, data: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/calls/${callId}/signal`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ signalType, data })
      });
      const resData = await res.json();
      return Boolean(resData.success);
    } catch {
      return false;
    }
  }
};
