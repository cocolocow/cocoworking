import Peer, { MediaConnection } from "peerjs";
import { gridDistance, proximityVolume, type Position } from "@cocoworking/shared";

const PROXIMITY_RADIUS = 3;
const CHECK_INTERVAL = 500; // ms

interface PeerConnection {
  call: MediaConnection;
  audioElement: HTMLAudioElement;
  playerId: string;
}

export class ProximityManager {
  private peer: Peer | null = null;
  private localStream: MediaStream | null = null;
  private connections = new Map<string, PeerConnection>();
  private localPosition: Position = { x: 5, y: 5 };
  private remotePlayers = new Map<string, { peerId: string; position: Position }>();
  private checkInterval: number | null = null;
  private onProximityChange?: (nearbyIds: string[]) => void;

  async init(socketId: string): Promise<string> {
    // Create PeerJS peer with socket ID as peer ID
    const peerId = `coco-${socketId}`;
    this.peer = new Peer(peerId);

    return new Promise((resolve, reject) => {
      this.peer!.on("open", (id) => {
        // Answer incoming calls
        this.peer!.on("call", (call) => {
          if (this.localStream) {
            call.answer(this.localStream);
            this.handleCall(call);
          }
        });

        // Start proximity checking loop
        this.checkInterval = window.setInterval(() => this.checkProximity(), CHECK_INTERVAL);
        resolve(id);
      });

      this.peer!.on("error", reject);
    });
  }

  async requestMedia(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    // Mute local audio to prevent feedback
    this.localStream.getAudioTracks().forEach((t) => (t.enabled = true));
    return this.localStream;
  }

  setLocalPosition(pos: Position) {
    this.localPosition = pos;
  }

  updateRemotePlayer(playerId: string, peerId: string, position: Position) {
    this.remotePlayers.set(playerId, { peerId, position });
  }

  removeRemotePlayer(playerId: string) {
    this.remotePlayers.delete(playerId);
    this.disconnectPeer(playerId);
  }

  setProximityCallback(cb: (nearbyIds: string[]) => void) {
    this.onProximityChange = cb;
  }

  private checkProximity() {
    if (!this.localStream || !this.peer) return;

    const nearby: string[] = [];

    for (const [playerId, remote] of this.remotePlayers) {
      const dist = gridDistance(this.localPosition, remote.position);
      const inRange = dist <= PROXIMITY_RADIUS;
      const connected = this.connections.has(playerId);

      if (inRange && !connected) {
        // Start call
        this.callPeer(playerId, remote.peerId);
      } else if (!inRange && connected) {
        // Hang up
        this.disconnectPeer(playerId);
      }

      if (inRange && connected) {
        // Adjust volume
        const volume = proximityVolume(this.localPosition, remote.position, PROXIMITY_RADIUS);
        const conn = this.connections.get(playerId);
        if (conn) conn.audioElement.volume = volume;
      }

      if (inRange) nearby.push(playerId);
    }

    this.onProximityChange?.(nearby);
  }

  private callPeer(playerId: string, peerId: string) {
    if (!this.peer || !this.localStream) return;
    if (this.connections.has(playerId)) return;

    const call = this.peer.call(peerId, this.localStream);
    this.handleCall(call, playerId);
  }

  private handleCall(call: MediaConnection, playerId?: string) {
    call.on("stream", (remoteStream) => {
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.volume = 0.5;

      const id = playerId || call.peer.replace("coco-", "");
      this.connections.set(id, { call, audioElement: audio, playerId: id });
    });

    call.on("close", () => {
      const id = playerId || call.peer.replace("coco-", "");
      this.connections.delete(id);
    });
  }

  private disconnectPeer(playerId: string) {
    const conn = this.connections.get(playerId);
    if (conn) {
      conn.call.close();
      conn.audioElement.srcObject = null;
      this.connections.delete(playerId);
    }
  }

  getVideoStream(playerId: string): MediaStream | null {
    const conn = this.connections.get(playerId);
    if (!conn) return null;
    return conn.audioElement.srcObject as MediaStream;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getNearbyPlayerIds(): string[] {
    const nearby: string[] = [];
    for (const [id, remote] of this.remotePlayers) {
      if (gridDistance(this.localPosition, remote.position) <= PROXIMITY_RADIUS) {
        nearby.push(id);
      }
    }
    return nearby;
  }

  destroy() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    for (const [id] of this.connections) {
      this.disconnectPeer(id);
    }
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.peer?.destroy();
  }
}
