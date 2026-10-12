import { realtimeClient } from "./realtimeClient";
import { callService } from "./callService";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;
  private targetUserId: string | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private isAudioMuted = false;
  private isVideoMuted = false;

  constructor() {
    this.setupSignalingListeners();
  }

  private setupSignalingListeners() {
    realtimeClient.on("webrtc_offer", async (msg) => {
      if (msg.callId === this.callId && this.peerConnection) {
        try {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.data.offer));
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);

          // Send answer back
          this.sendSignal("webrtc_answer", { answer });
        } catch (err) {
          console.error("[WebRTC] Error handling offer:", err);
        }
      }
    });

    realtimeClient.on("webrtc_answer", async (msg) => {
      if (msg.callId === this.callId && this.peerConnection) {
        try {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.data.answer));
        } catch (err) {
          console.error("[WebRTC] Error handling answer:", err);
        }
      }
    });

    realtimeClient.on("ice_candidate", async (msg) => {
      if (msg.callId === this.callId && this.peerConnection && msg.data.candidate) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(msg.data.candidate));
        } catch (err) {
          console.error("[WebRTC] Error adding ICE candidate:", err);
        }
      }
    });
  }

  public async startLocalMedia(type: "audio" | "video"): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (err) {
      console.warn("[WebRTC] Could not access physical media devices, fallback to simulated audio/video track:", err);
      // Fallback empty media stream if hardware unavailable/blocked in preview
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "24px sans-serif";
        ctx.fillText("SentimentAI Call Active", 180, 240);
      }
      const stream = canvas.captureStream ? canvas.captureStream(15) : new MediaStream();
      this.localStream = stream;
      return this.localStream;
    }
  }

  public async initializePeerConnection(
    callId: string,
    targetUserId: string,
    isCaller: boolean,
    onRemoteStream: (stream: MediaStream) => void,
    onStateChange: (state: RTCPeerConnectionState) => void
  ) {
    this.callId = callId;
    this.targetUserId = targetUserId;
    this.onRemoteStreamCallback = onRemoteStream;
    this.onConnectionStateChangeCallback = onStateChange;

    this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

    this.remoteStream = new MediaStream();
    if (this.onRemoteStreamCallback) {
      this.onRemoteStreamCallback(this.remoteStream);
    }

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    // Receive remote tracks
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal("ice_candidate", { candidate: event.candidate });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
      }
    };

    if (isCaller) {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.sendSignal("webrtc_offer", { offer });
    }
  }

  private sendSignal(signalType: string, data: any) {
    if (!this.targetUserId || !this.callId) return;

    // Send via WebSocket first
    const sent = realtimeClient.send({
      type: signalType,
      callId: this.callId,
      targetUserId: this.targetUserId,
      data
    });

    // Fallback to HTTP API if WebSocket is offline
    if (!sent) {
      callService.sendSignal(this.callId, signalType, data);
    }
  }

  public toggleAudio(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isAudioMuted = !audioTrack.enabled;
      return this.isAudioMuted;
    }
    return false;
  }

  public toggleVideo(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isVideoMuted = !videoTrack.enabled;
      return this.isVideoMuted;
    }
    return false;
  }

  public cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.callId = null;
    this.targetUserId = null;
    this.remoteStream = null;
    this.isAudioMuted = false;
    this.isVideoMuted = false;
  }

  public getLocalStream() {
    return this.localStream;
  }

  public getRemoteStream() {
    return this.remoteStream;
  }
}

export const webrtcManager = new WebRTCManager();
