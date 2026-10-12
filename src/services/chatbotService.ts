/**
 * Frontend Gemini Chatbot Service
 * Interacts with server-side Gemini 3.8 Flash endpoint and manages local conversation threads.
 */

export type ChatbotPersona = "general" | "coach" | "analyst" | "executive" | "counselor";

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "assistant";
  content: string;
  timestamp: string;
  persona?: ChatbotPersona;
  suggestedFollowUps?: string[];
}

export interface ChatThread {
  id: string;
  title: string;
  persona: ChatbotPersona;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface PersonaInfo {
  id: ChatbotPersona;
  name: string;
  tagline: string;
  icon: string;
  description: string;
}

const STORAGE_KEY = "sentimentai_gemini_chats_v1";
import { firestoreService } from "./firestoreService";

const DEFAULT_PERSONAS: PersonaInfo[] = [
  {
    id: "general",
    name: "Gemini Emotion AI",
    tagline: "Multipurpose Emotional Intelligence & Sentiment Assistant",
    icon: "Sparkles",
    description: "Comprehensive guidance across sentiment analysis, emotion recognition, psycholinguistics, and communication."
  },
  {
    id: "coach",
    name: "EQ & Empathy Coach",
    tagline: "Active Listening & Conflict Resolution Guide",
    icon: "HeartHandshake",
    description: "Specialized in navigating interpersonal friction, practicing nonviolent communication, and cultivating relational awareness."
  },
  {
    id: "analyst",
    name: "Sentiment & Data Analyst",
    tagline: "Quantitative Polarity, Arousal & Linguistic Markers",
    icon: "BarChart2",
    description: "Technical breakdowns of emotional dimensions, lexical polarity scores, confidence metrics, and psychological indicators."
  },
  {
    id: "executive",
    name: "Executive Strategist",
    tagline: "High-Impact, Diplomatic & Persuasive Communications",
    icon: "Briefcase",
    description: "Optimized for leaders, managers, and teams looking to calibrate assertiveness, professional tact, and clarity."
  },
  {
    id: "counselor",
    name: "Reflective Partner",
    tagline: "Safe, Compassionate & Grounded Conversation",
    icon: "Smile",
    description: "Warm, empathetic processing of difficult conversations and validation of complex emotions."
  }
];

export const chatbotClientService = {
  /**
   * Get available AI Personas
   */
  getPersonas: async (): Promise<PersonaInfo[]> => {
    try {
      const res = await fetch("/api/chatbot/personas");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_PERSONAS;
  },

  /**
   * Send messages to Gemini Chatbot backend
   */
  sendMessage: async (params: {
    messages: Array<{ role: "user" | "model" | "assistant"; content: string }>;
    persona?: ChatbotPersona;
    context?: string;
  }): Promise<{ reply: string; persona: ChatbotPersona; timestamp: string; suggestedFollowUps?: string[] }> => {
    const res = await fetch("/api/chatbot/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: params.messages,
        persona: params.persona || "general",
        context: params.context
      })
    });

    if (!res.ok) {
      let errorMsg = "Failed to communicate with Gemini chatbot.";
      try {
        const errJson = await res.json();
        if (errJson.error?.message) errorMsg = errJson.error.message;
      } catch {}
      throw new Error(errorMsg);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Local Chat Thread Persistence
   */
  loadThreads: (): ChatThread[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load stored chat threads:", e);
    }
    return [];
  },

  saveThreads: (threads: ChatThread[], userId?: string): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
      if (userId && threads.length > 0) {
        const latest = threads[0];
        firestoreService.saveChatThread(userId, {
          id: latest.id,
          title: latest.title,
          persona: latest.persona,
          messages: latest.messages
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Failed to save chat threads:", e);
    }
  },

  createNewThread: (persona: ChatbotPersona = "general", initialTitle = "New Conversation"): ChatThread => {
    const newThread: ChatThread = {
      id: "chat_" + Math.random().toString(36).substring(2, 11),
      title: initialTitle,
      persona,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return newThread;
  }
};
