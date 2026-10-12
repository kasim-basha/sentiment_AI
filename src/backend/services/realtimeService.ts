import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { verifyToken } from "../auth/token";
import { db } from "../database";

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  email: string;
  connectedAt: number;
}

class RealtimeHub {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<ClientConnection>> = new Map(); // userId -> Set<ClientConnection>
  private userTypingStates: Map<string, { conversationId: string; expiresAt: number }> = new Map(); // `${userId}_${convId}`

  public initialize(server: HttpServer) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws"
    });

    this.wss.on("connection", (ws: WebSocket, req) => {
      let currentUserId: string | null = null;
      let connectionRecord: ClientConnection | null = null;

      ws.on("message", (raw) => {
        try {
          const payload = JSON.parse(raw.toString());

          // Handle authentication on connect
          if (payload.type === "auth") {
            const token = payload.token;
            if (token) {
              const decoded = verifyToken(token);
              if (decoded && decoded.userId) {
                currentUserId = decoded.userId;
                connectionRecord = {
                  ws,
                  userId: decoded.userId,
                  email: decoded.email,
                  connectedAt: Date.now()
                };

                if (!this.clients.has(currentUserId)) {
                  this.clients.set(currentUserId, new Set());
                }
                this.clients.get(currentUserId)!.add(connectionRecord);

                ws.send(JSON.stringify({
                  type: "auth_success",
                  userId: currentUserId
                }));

                // Broadcast online status to friends
                this.broadcastPresence(currentUserId, true);
              } else {
                ws.send(JSON.stringify({ type: "auth_error", message: "Invalid token." }));
              }
            }
          }

          // Handle Typing start/stop
          if (payload.type === "typing_start" && currentUserId) {
            const { conversationId, receiverId } = payload;
            if (receiverId) {
              this.sendToUser(receiverId, {
                type: "typing_start",
                conversationId,
                userId: currentUserId
              });
            }
          }

          if (payload.type === "typing_stop" && currentUserId) {
            const { conversationId, receiverId } = payload;
            if (receiverId) {
              this.sendToUser(receiverId, {
                type: "typing_stop",
                conversationId,
                userId: currentUserId
              });
            }
          }

          // Handle WebRTC signaling directly over WebSocket
          if ((payload.type === "webrtc_offer" || payload.type === "webrtc_answer" || payload.type === "ice_candidate") && currentUserId) {
            const { targetUserId, callId, data } = payload;
            if (targetUserId) {
              this.sendToUser(targetUserId, {
                type: payload.type,
                callId,
                fromUserId: currentUserId,
                data
              });
            }
          }

          // Handle Ping/Heartbeat
          if (payload.type === "ping") {
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          }

        } catch (err) {
          // Ignore invalid JSON payloads
        }
      });

      ws.on("close", () => {
        if (currentUserId && connectionRecord) {
          const userSet = this.clients.get(currentUserId);
          if (userSet) {
            userSet.delete(connectionRecord);
            if (userSet.size === 0) {
              this.clients.delete(currentUserId);
              this.broadcastPresence(currentUserId, false);
            }
          }
        }
      });

      ws.on("error", () => {
        // Safe socket error handler
      });
    });

    console.log("[RealtimeHub] WebSocket signaling server initialized on /ws");
  }

  public isUserOnline(userId: string): boolean {
    const conns = this.clients.get(userId);
    return Boolean(conns && conns.size > 0);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  public sendToUser(userId: string, data: Record<string, any>) {
    const userSet = this.clients.get(userId);
    if (!userSet || userSet.size === 0) return false;

    const payload = JSON.stringify(data);
    for (const client of userSet) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(payload);
        } catch (err) {
          // socket closed
        }
      }
    }
    return true;
  }

  private broadcastPresence(userId: string, isOnline: boolean) {
    try {
      const friends = db.getFriends(userId);
      for (const f of friends) {
        this.sendToUser(f.id, {
          type: isOnline ? "user_online" : "user_offline",
          userId
        });
      }
    } catch (e) {
      // ignore
    }
  }
}

export const realtimeHub = new RealtimeHub();
