import { io, Socket } from "socket.io-client";
import type { Player, ChatMessage, DJState, PomodoroState } from "@cocoworking/shared";

export type NetworkEvents = {
  onRoomState: (players: Record<string, Player>) => void;
  onPlayerJoin: (player: Player) => void;
  onPlayerLeave: (playerId: string) => void;
  onPlayerMove: (id: string, x: number, y: number) => void;
  onChat: (message: ChatMessage) => void;
  onPeerId?: (playerId: string, peerId: string) => void;
  onDJState?: (state: DJState) => void;
  onPomodoroUpdate?: (state: PomodoroState) => void;
  onPomodoroEnd?: () => void;
};

export class NetworkManager {
  private socket: Socket;
  private events: NetworkEvents;

  constructor(serverUrl: string, playerName: string, events: NetworkEvents) {
    this.events = events;
    this.socket = io(serverUrl, {
      query: { name: playerName },
    });

    this.socket.on("room:state", (players: Record<string, Player>) => {
      this.events.onRoomState(players);
    });

    this.socket.on("player:join", (player: Player) => {
      this.events.onPlayerJoin(player);
    });

    this.socket.on("player:leave", (playerId: string) => {
      this.events.onPlayerLeave(playerId);
    });

    this.socket.on("player:move", (data: { id: string; x: number; y: number }) => {
      if (data.id !== this.socket.id) {
        this.events.onPlayerMove(data.id, data.x, data.y);
      }
    });

    this.socket.on("chat:message", (message: ChatMessage) => {
      this.events.onChat(message);
    });

    this.socket.on("peer:id", (data: { playerId: string; peerId: string }) => {
      this.events.onPeerId?.(data.playerId, data.peerId);
    });

    this.socket.on("dj:state", (state: DJState) => {
      this.events.onDJState?.(state);
    });

    this.socket.on("pomodoro:update", (state: PomodoroState) => {
      this.events.onPomodoroUpdate?.(state);
    });

    this.socket.on("pomodoro:end", () => {
      this.events.onPomodoroEnd?.();
    });
  }

  sendMove(x: number, y: number, direction?: string) {
    this.socket.emit("player:move", { x, y, direction });
  }

  sendChat(content: string) {
    this.socket.emit("chat:send", { content });
  }

  sendPeerId(peerId: string) {
    this.socket.emit("peer:id", { peerId });
  }

  // DJ
  claimDJ() { this.socket.emit("dj:claim"); }
  releaseDJ() { this.socket.emit("dj:release"); }
  djPlay() { this.socket.emit("dj:play"); }
  djPause() { this.socket.emit("dj:pause"); }
  djNext() { this.socket.emit("dj:next"); }
  djPrev() { this.socket.emit("dj:prev"); }
  djVolume(volume: number) { this.socket.emit("dj:volume", { volume }); }
  djAddTrack(url: string) { this.socket.emit("dj:addtrack", { url }); }
  djUpdateTitle(youtubeId: string, title: string) { this.socket.emit("dj:updatetitle", { youtubeId, title }); }

  // Pomodoro
  startPomodoro(preset: "default" | "long" = "default") {
    this.socket.emit("pomodoro:start", { preset });
  }
  stopPomodoro() { this.socket.emit("pomodoro:stop"); }

  getSocketId(): string | undefined {
    return this.socket.id;
  }

  disconnect() {
    this.socket.disconnect();
  }
}
