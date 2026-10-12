import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { realtimeHub } from "../services/realtimeService";
import { CallType } from "../database/types";

export const callController = {
  // POST /api/calls (Initiate call session)
  initiateCall: (req: Request, res: Response, next: NextFunction) => {
    try {
      const callerId = req.user!.id;
      const { receiverId, type } = req.body;

      if (!receiverId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Receiver ID is required." }
        });
      }

      const callType: CallType = type === "video" ? "video" : "audio";
      const session = db.createCallSession(callerId, receiverId, callType);
      const caller = db.findUserById(callerId);

      // Realtime signal to receiver
      realtimeHub.sendToUser(receiverId, {
        type: "incoming_call",
        call: {
          ...session,
          caller: caller ? { id: caller.id, name: caller.name, avatar: caller.avatar } : null
        }
      });

      res.status(201).json({
        success: true,
        session
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "CALL_ERROR", message: err.message || "Failed to initiate call." }
      });
    }
  },

  // GET /api/calls (Call history)
  getCallHistory: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const history = db.getCallHistory(userId);
      res.json({
        success: true,
        calls: history,
        total: history.length
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/calls/:id
  getCallSession: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const session = db.getCallSession(id, userId);
      res.json({
        success: true,
        session
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: err.message || "Call session not found." }
      });
    }
  },

  // POST /api/calls/:id/accept
  acceptCall: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const session = db.acceptCall(id, userId);

      // Notify caller
      realtimeHub.sendToUser(session.callerId, {
        type: "call_accepted",
        callId: session._id,
        acceptedBy: userId
      });

      res.json({
        success: true,
        session
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "CALL_ACCEPT_ERROR", message: err.message || "Failed to accept call." }
      });
    }
  },

  // POST /api/calls/:id/reject
  rejectCall: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const session = db.rejectCall(id, userId);

      // If caller rejected or receiver missed, create missed call notification
      const caller = db.findUserById(session.callerId);
      db.createNotification({
        userId: session.receiverId,
        type: "missed_call",
        title: "Missed Call",
        message: `Missed ${session.type} call from ${caller?.name || "Someone"}`,
        data: {
          callId: session._id,
          callerId: session.callerId,
          callerName: caller?.name || "Friend",
          type: session.type
        }
      });

      // Notify caller
      const otherId = session.callerId === userId ? session.receiverId : session.callerId;
      realtimeHub.sendToUser(otherId, {
        type: "call_rejected",
        callId: session._id,
        rejectedBy: userId
      });

      res.json({
        success: true,
        session
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "CALL_REJECT_ERROR", message: err.message || "Failed to reject call." }
      });
    }
  },

  // POST /api/calls/:id/end
  endCall: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const session = db.endCall(id, userId);

      // Notify the other peer
      const otherId = session.callerId === userId ? session.receiverId : session.callerId;
      realtimeHub.sendToUser(otherId, {
        type: "call_ended",
        callId: session._id,
        endedBy: userId,
        duration: session.duration
      });

      res.json({
        success: true,
        session
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "CALL_END_ERROR", message: err.message || "Failed to end call." }
      });
    }
  },

  // POST /api/calls/:id/signal (HTTP fallback signaling for WebRTC offer, answer, ice-candidate)
  sendSignal: (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { signalType, data } = req.body;

      const session = db.getCallSession(id, userId);
      const targetId = session.callerId === userId ? session.receiverId : session.callerId;

      realtimeHub.sendToUser(targetId, {
        type: signalType, // "webrtc_offer", "webrtc_answer", "ice_candidate"
        callId: id,
        fromUserId: userId,
        data
      });

      res.json({ success: true });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "SIGNAL_ERROR", message: err.message || "Failed to route WebRTC signal." }
      });
    }
  }
};
