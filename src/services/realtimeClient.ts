import { authService } from "./authService";

type EventHandler = (payload: any) => void;

class RealtimeClient {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private isConnected = false;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private shouldReconnect = true;

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = authService.getStoredToken();
    if (!token) return;

    this.shouldReconnect = true;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        // Authenticate immediately
        this.send({ type: "auth", token });
        this.emit("connection_change", { connected: true });

        // Start heartbeat
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          this.send({ type: "ping" });
        }, 25000);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type) {
            this.emit(message.type, message);
            this.emit("*", message);
          }
        } catch {
          // ignore
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.emit("connection_change", { connected: false });

        if (this.shouldReconnect) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };

      this.socket.onerror = () => {
        // Socket error handled by close
      };
    } catch {
      // ignore
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  public send(data: Record<string, any>) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  public on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.off(event, handler);
    };
  }

  public off(event: string, handler: EventHandler) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  private emit(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(fn => {
        try {
          fn(data);
        } catch (err) {
          console.error(`[RealtimeClient] Error in listener for ${event}:`, err);
        }
      });
    }
  }

  public getConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeClient = new RealtimeClient();
