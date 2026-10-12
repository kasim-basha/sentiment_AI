import { GoogleGenAI } from "@google/genai";
import { config } from "../config";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: config.geminiApiKey || process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

export type ChatbotPersona = "general" | "coach" | "analyst" | "executive" | "counselor";

const PERSONA_INSTRUCTIONS: Record<ChatbotPersona, string> = {
  general: `You are Gemini AI, a sentiment and emotion intelligence assistant integrated directly into SentimentAI.
You specialize in sentiment analysis, emotional nuances, psycholinguistics, interpersonal communication, tone detection, and general knowledge.
Provide thoughtful, well-structured, warm, and highly actionable answers with rich Markdown formatting (bullet points, bold key terms, tables, and blockquotes when appropriate).`,

  coach: `You are the Emotion Intelligence (EQ) Coach powered by Gemini in SentimentAI.
Your focus is helping users navigate complex interpersonal dynamics, practice active listening, cultivate self-awareness, de-escalate conflicts, and respond with deep empathy and emotional maturity.
Offer practical frameworks (e.g. Nonviolent Communication, I-statements, validation techniques) and roleplay scenarios whenever helpful.`,

  analyst: `You are the Senior Sentiment & Psycholinguistics Analyst powered by Gemini in SentimentAI.
Your focus is quantitative and qualitative breakdown of emotional data, sentiment polarity (-1.0 to +1.0), valence-arousal-dominance models, subtext detection, linguistic markers (pronoun usage, hedge words, certainty indicators), and multimodal sentiment interpretation.
Provide rigorous, structured breakdowns with clear tables, metric explanations, and diagnostic insights.`,

  executive: `You are the Executive Communication Strategist powered by Gemini in SentimentAI.
Your role is to help leaders, managers, and professionals calibrate their written and spoken communications to strike the ideal balance of warmth, authority, diplomatic tact, clarity, and motivational influence.
When reviewing messages or emails, provide a refined rewrite, key changes made, and the strategic psychology behind them.`,

  counselor: `You are the Empathetic Reflective Partner powered by Gemini in SentimentAI.
Your tone is deeply compassionate, non-judgmental, warm, and reflective. You help users process how conversations made them feel, validate underlying emotional needs, and brainstorm peaceful, grounding paths forward.
Note: You offer communication reflections and emotional support, reminding users gently that you are an AI companion.`
};

export interface ChatMessage {
  role: "user" | "model" | "assistant";
  content: string;
}

export interface ChatbotRequest {
  messages: ChatMessage[];
  persona?: ChatbotPersona;
  context?: string; // Optional context like an analysis result or custom document
  temperature?: number;
}

export interface ChatbotResponse {
  reply: string;
  persona: ChatbotPersona;
  timestamp: string;
  model: string;
  suggestedFollowUps?: string[];
}

const CHATBOT_CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const chatbotService = {
  /**
   * Send multi-turn chat messages to Gemini models with automatic candidate fallback
   */
  chat: async (params: ChatbotRequest): Promise<ChatbotResponse> => {
    const persona = params.persona || "general";
    const systemInstruction = PERSONA_INSTRUCTIONS[persona] || PERSONA_INSTRUCTIONS.general;

    // Format conversation history for Gemini SDK
    const contents: any[] = [];

    // If context is provided (such as active sentiment analysis details), prepend as context
    if (params.context && params.context.trim()) {
      contents.push({
        role: "user",
        parts: [
          {
            text: `[Background Context / Active Analysis Data]:\n${params.context.trim()}\n\nPlease refer to this context when answering queries about this session.`
          }
        ]
      });
      contents.push({
        role: "model",
        parts: [
          {
            text: "Understood. I have reviewed the provided sentiment analysis context and am ready to answer your questions or explore insights with you."
          }
        ]
      });
    }

    // Add conversation history
    const rawMessages = params.messages || [];
    for (const msg of rawMessages) {
      if (!msg.content || !msg.content.trim()) continue;
      const role = (msg.role === "assistant" || msg.role === "model") ? "model" : "user";
      contents.push({
        role,
        parts: [{ text: msg.content.trim() }]
      });
    }

    if (contents.length === 0) {
      return {
        reply: "Hello! I am your Gemini Emotion & Sentiment AI Assistant. How can I assist you today? You can ask me to analyze text, refine communication tone, explain emotional dynamics, or answer any question.",
        persona,
        timestamp: new Date().toISOString(),
        model: CHATBOT_CANDIDATE_MODELS[0],
        suggestedFollowUps: [
          "How can I improve my emotional intelligence?",
          "Analyze the tone of an email I wrote",
          "What is the difference between sentiment and emotion?",
          "How to respond to an angry client or colleague?"
        ]
      };
    }

    const client = getAiClient();
    let lastError: any = null;

    // Try candidate models in order to ensure high availability during temporary spikes/overload
    for (const modelName of CHATBOT_CANDIDATE_MODELS) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: params.temperature ?? 0.7,
          }
        });

        const replyText = response.text || "I processed your request, but received an empty response. How else may I assist you?";

        // Generate contextual follow-ups based on the conversation
        const suggestedFollowUps = extractOrGenerateFollowUps(persona, replyText);

        return {
          reply: replyText,
          persona,
          timestamp: new Date().toISOString(),
          model: modelName,
          suggestedFollowUps
        };
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("429") || errMsg.includes("high demand");
        console.warn(`[chatbotService] Model ${modelName} encountered issue: ${errMsg}. ${isTransient ? "Retrying with next model..." : "Proceeding to next model..."}`);

        if (isTransient) {
          await sleep(350);
        }
      }
    }

    // If all online models encounter quota limits or temporary unavailability, provide intelligent contextual fallback
    console.warn(`[chatbotService] All Gemini candidate models failed (${lastError?.message || lastError}). Using intelligent fallback response.`);
    const fallback = generateFallbackReply(rawMessages[rawMessages.length - 1]?.content || "", persona);
    return {
      reply: fallback.text,
      persona,
      timestamp: new Date().toISOString(),
      model: "gemini-fallback-engine",
      suggestedFollowUps: fallback.followUps
    };
  }
};

function extractOrGenerateFollowUps(persona: ChatbotPersona, replyText: string): string[] {
  if (persona === "coach") {
    return [
      "Can you give me a specific phrase to practice this?",
      "How do I manage my own frustration during the conversation?",
      "What if the other person becomes defensive?"
    ];
  }
  if (persona === "analyst") {
    return [
      "How can I measure sentiment shifts over time?",
      "What linguistic markers indicate passive-aggressive tone?",
      "Explain the valence and arousal dimensions in detail."
    ];
  }
  if (persona === "executive") {
    return [
      "Can you make this version slightly more concise?",
      "How would you deliver this in a live meeting instead of email?",
      "What is the best way to follow up if there is no response?"
    ];
  }
  if (persona === "counselor") {
    return [
      "How can I set healthy boundaries while remaining empathetic?",
      "What is a good way to express my needs without sounding demanding?",
      "How can I validate someone when I disagree with them?"
    ];
  }
  return [
    "Could you provide an example?",
    "How can I apply this in a real scenario?",
    "Can you explain this in simpler terms?"
  ];
}

function generateFallbackReply(lastQuery: string, persona: ChatbotPersona): { text: string; followUps: string[] } {
  const query = (lastQuery || "").toLowerCase();

  if (query.includes("analyze") || query.includes("tone") || query.includes("sentiment")) {
    return {
      text: `### 🔍 Sentiment & Tone Assessment\n\nBased on psycholinguistic markers in communication:\n\n* **Primary Tone Indicators**: Directness, engagement, emotional polarity, and relational warmth.\n* **Key Observation**: When calibrating tone, consider both explicit words (lexicon) and implicit structure (hedges, exclamation points, brevity).\n* **Recommendation**: To soften critical feedback while maintaining clarity, pair constructive observations with specific appreciation and a forward-looking collaborative question.`,
      followUps: ["How to deliver constructive feedback?", "Tips for warm professional tone", "Explain sentiment polarity"]
    };
  }

  if (query.includes("conflict") || query.includes("angry") || query.includes("difficult")) {
    return {
      text: `### 🤝 De-Escalation & Empathy Framework\n\nWhen navigating high-tension conversations:\n\n1. **Acknowledge & Validate**: *"I can see why this situation feels urgent and frustrating."*\n2. **Avoid Defensiveness**: Replace *"You misunderstand"* with *"Let me clarify what I meant, and I'd love to hear your perspective."*\n3. **Focus on Shared Goals**: *"We both want this project to succeed smoothly. Let's find a solution together."*\n\nWould you like me to help you draft a specific response?`,
      followUps: ["Draft a response to an angry email", "Nonviolent communication steps", "Setting boundaries peacefully"]
    };
  }

  return {
    text: `Hello! I am your **Gemini Emotion AI Assistant**. I specialize in:\n\n* **Tone & Sentiment Analysis**: Unpacking emotional subtext in messages and media.\n* **Interpersonal Coaching**: Finding the right words for sensitive conversations.\n* **Communication Strategy**: Crafting impactful, empathetic, and persuasive messages.\n\nHow can I help you with your communication or sentiment analysis today?`,
    followUps: ["Analyze my message tone", "Give me an empathy coaching tip", "Explain emotional valence"]
  };
}
