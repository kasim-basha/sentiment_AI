import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { clarityAssistantService } from "../services/clarityAssistantService";
import { auditService } from "../services/auditService";

export const clarityController = {
  /**
   * POST /api/clarity/conversations
   * Create a new clarity assistant conversation for an analysis session
   */
  createConversation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const { analysisId, title, initialQuestion, mode = "general", language = "English" } = req.body;
      if (!analysisId || typeof analysisId !== "string") {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_REQUEST", message: "analysisId is required." }
        });
      }

      // Check analysis existence and ownership
      const session = db.getAnalysisSession(analysisId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Analysis session not found." }
        });
      }

      if (session.userId !== userId && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You do not have permission to access this analysis." }
        });
      }

      const conversation = db.createClarityConversation(
        userId,
        analysisId,
        title || `Clarity - ${session.title?.slice(0, 30) || session.analysisId}`
      );

      const result = db.getAnalysisResult(analysisId);

      // If an initial question was provided, process it immediately
      let initialAssistantMsg = null;
      let initialUserMsg = null;

      if (initialQuestion && typeof initialQuestion === "string" && initialQuestion.trim()) {
        const cleanQ = initialQuestion.trim().slice(0, 1000);
        initialUserMsg = db.addClarityMessage({
          conversationId: conversation._id,
          role: "user",
          content: cleanQ,
          explanationType: mode
        });

        const clarityRes = await clarityAssistantService.askClarity({
          session,
          result,
          question: cleanQ,
          mode,
          language
        });

        initialAssistantMsg = db.addClarityMessage({
          conversationId: conversation._id,
          role: "assistant",
          content: clarityRes.answer,
          explanationType: clarityRes.explanationType,
          references: clarityRes.references,
          confidenceNote: clarityRes.confidenceNote,
          disclaimer: clarityRes.disclaimer,
          structuredResponse: {
            conversationId: conversation._id,
            messageId: "",
            answer: clarityRes.answer,
            explanationType: clarityRes.explanationType,
            references: clarityRes.references,
            confidenceNote: clarityRes.confidenceNote,
            disclaimer: clarityRes.disclaimer
          }
        });
      }

      auditService.log({
        userId,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: "CLARITY_CONVERSATION_CREATED",
        targetType: "clarity_conversation",
        targetId: conversation._id,
        metadata: { analysisId }
      });

      const fullConversation = db.getClarityConversationById(conversation._id, userId);

      return res.status(201).json({
        success: true,
        conversation: fullConversation || conversation
      });
    } catch (err: any) {
      console.error("[clarityController.createConversation] Error:", err);
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err?.message || "Failed to create conversation." }
      });
    }
  },

  /**
   * GET /api/clarity/conversations
   * List user's conversations, optionally filtered by analysisId
   */
  getConversations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const analysisId = req.query.analysisId as string | undefined;
      const conversations = db.getClarityConversations(userId, analysisId);

      return res.json({
        success: true,
        total: conversations.length,
        conversations
      });
    } catch (err: any) {
      console.error("[clarityController.getConversations] Error:", err);
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err?.message || "Failed to get conversations." }
      });
    }
  },

  /**
   * GET /api/clarity/conversations/:id
   * Get single conversation with message history
   */
  getConversation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const conversationId = req.params.id;
      const conversation = db.getClarityConversationById(conversationId, userId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Conversation not found or access denied." }
        });
      }

      return res.json({
        success: true,
        conversation
      });
    } catch (err: any) {
      console.error("[clarityController.getConversation] Error:", err);
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err?.message || "Failed to get conversation." }
      });
    }
  },

  /**
   * POST /api/clarity/conversations/:id/messages
   * Send a question to the clarity assistant
   */
  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const conversationId = req.params.id;
      const { content, mode = "general", section, language = "English" } = req.body;

      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_REQUEST", message: "Message content cannot be empty." }
        });
      }

      const cleanContent = content.trim().slice(0, 1500);

      // Verify conversation ownership
      const conversation = db.getClarityConversationById(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Conversation not found or access denied." }
        });
      }

      // Verify analysis ownership
      const session = db.getAnalysisSession(conversation.analysisId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Underlying analysis session not found." }
        });
      }

      if (session.userId !== userId && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You do not have access to this analysis data." }
        });
      }

      const result = db.getAnalysisResult(conversation.analysisId);

      // Save user message
      const userMessage = db.addClarityMessage({
        conversationId,
        role: "user",
        content: cleanContent,
        explanationType: mode
      });

      // Get prior history for multi-turn context
      const history = conversation.messages || [];

      // Generate AI explanation
      const clarityRes = await clarityAssistantService.askClarity({
        session,
        result,
        question: cleanContent,
        conversationHistory: history,
        mode,
        section,
        language
      });

      // Save assistant message
      const assistantMessage = db.addClarityMessage({
        conversationId,
        role: "assistant",
        content: clarityRes.answer,
        explanationType: clarityRes.explanationType,
        references: clarityRes.references,
        confidenceNote: clarityRes.confidenceNote,
        disclaimer: clarityRes.disclaimer,
        structuredResponse: {
          conversationId,
          messageId: "",
          answer: clarityRes.answer,
          explanationType: clarityRes.explanationType,
          references: clarityRes.references,
          confidenceNote: clarityRes.confidenceNote,
          disclaimer: clarityRes.disclaimer
        }
      });

      return res.status(201).json({
        success: true,
        userMessage,
        assistantMessage
      });
    } catch (err: any) {
      console.error("[clarityController.sendMessage] Error:", err);
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err?.message || "Failed to generate explanation." }
      });
    }
  },

  /**
   * DELETE /api/clarity/conversations/:id
   * Delete a conversation and its messages
   */
  deleteConversation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const conversationId = req.params.id;
      const success = db.deleteClarityConversation(conversationId, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Conversation not found or access denied." }
        });
      }

      return res.json({
        success: true,
        message: "Conversation deleted successfully."
      });
    } catch (err: any) {
      console.error("[clarityController.deleteConversation] Error:", err);
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err?.message || "Failed to delete conversation." }
      });
    }
  },

  /**
   * POST /api/clarity/explain
   * Quick one-shot explanation without opening a long conversation
   */
  quickExplain: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." }
        });
      }

      const {
        analysisId,
        mode = "simple",
        section,
        language = "English",
        question = "Can you please explain this analysis in clear, understandable terms?"
      } = req.body;

      if (!analysisId) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_REQUEST", message: "analysisId is required." }
        });
      }

      const session = db.getAnalysisSession(analysisId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Analysis session not found." }
        });
      }

      if (session.userId !== userId && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You do not have access to this analysis." }
        });
      }

      const result = db.getAnalysisResult(analysisId);

      const clarityRes = await clarityAssistantService.askClarity({
        session,
        result,
        question,
        mode,
        section,
        language
      });

      return res.json({
        success: true,
        explanation: clarityRes
      });
    } catch (err: any) {
      console.error("[clarityController.quickExplain] Error:", err);
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err?.message || "Failed to generate explanation." }
      });
    }
  }
};
