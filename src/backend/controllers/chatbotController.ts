import { Request, Response, NextFunction } from "express";
import { chatbotService, ChatbotPersona } from "../services/chatbotService";
import { auditService } from "../services/auditService";

export const chatbotController = {
  /**
   * POST /api/chatbot/message
   * Send a chat message or conversation history to Gemini
   */
  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages, message, persona = "general", context, temperature } = req.body;

      // Support either an array of messages or a single message string
      let formattedMessages = Array.isArray(messages) ? messages : [];
      if (typeof message === "string" && message.trim()) {
        formattedMessages = [...formattedMessages, { role: "user", content: message.trim() }];
      }

      if (formattedMessages.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_REQUEST", message: "A message or array of messages is required." }
        });
      }

      const validPersona: ChatbotPersona = ["general", "coach", "analyst", "executive", "counselor"].includes(persona)
        ? persona
        : "general";

      const response = await chatbotService.chat({
        messages: formattedMessages,
        persona: validPersona,
        context,
        temperature
      });

      // Audit log if user is logged in
      if (req.user?.id) {
        auditService.log({
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          action: "GEMINI_CHATBOT_MESSAGE",
          targetType: "chatbot",
          targetId: validPersona,
          metadata: {
            persona: validPersona,
            messageCount: formattedMessages.length
          }
        });
      }

      return res.json({
        success: true,
        data: response
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/chatbot/personas
   * Return available AI personas and metadata
   */
  getPersonas: async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: [
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
      ]
    });
  }
};
