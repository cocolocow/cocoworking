import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
import {
  type Player,
  type ChatMessage,
  type DJState,
  type PomodoroState,
  type PomodoroConfig,
  createDJState,
  claimDJ,
  releaseDJ,
  playTrack,
  pauseTrack,
  nextTrack,
  prevTrack,
  setVolume,
  isDJ,
  addTrackFromUrl,
  updateTrackTitle,
  DEFAULT_PLAYLIST,
  createPomodoroState,
  isPhaseOver,
  nextPhase,
  DEFAULT_CONFIG,
  LONG_CONFIG,
} from "@cocoworking/shared";

interface ServerState {
  players: Map<string, Player>;
  dj: DJState;
  pomodoro: PomodoroState | null;
}

export function createSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: { origin: "*" },
  });

  const state: ServerState = {
    players: new Map(),
    dj: { ...createDJState(), playlist: DEFAULT_PLAYLIST },
    pomodoro: null,
  };

  // Pomodoro timer check
  let pomodoroInterval: ReturnType<typeof setInterval> | null = null;

  function startPomodoroTimer() {
    if (pomodoroInterval) return;
    pomodoroInterval = setInterval(() => {
      if (!state.pomodoro) { stopPomodoroTimer(); return; }
      const now = Date.now();
      if (isPhaseOver(state.pomodoro, now)) {
        const next = nextPhase(state.pomodoro, now);
        if (next) {
          state.pomodoro = next;
          io.emit("pomodoro:update", state.pomodoro);
        } else {
          state.pomodoro = null;
          io.emit("pomodoro:end");
          stopPomodoroTimer();
        }
      }
    }, 1000);
  }

  function stopPomodoroTimer() {
    if (pomodoroInterval) { clearInterval(pomodoroInterval); pomodoroInterval = null; }
  }

  io.on("connection", (socket) => {
    const name = (socket.handshake.query.name as string) || `Player${socket.id.slice(0, 4)}`;

    const player: Player = {
      id: socket.id,
      name,
      position: { x: 5, y: 5 },
      direction: "south",
    };
    state.players.set(socket.id, player);

    // Send full state
    socket.emit("room:state", Object.fromEntries(state.players));
    socket.emit("dj:state", state.dj);
    if (state.pomodoro) socket.emit("pomodoro:update", state.pomodoro);

    socket.broadcast.emit("player:join", player);

    // ─── Movement ─────────────────────────────────
    socket.on("player:move", (data: { x: number; y: number; direction?: string }) => {
      if (!isValidPosition(data.x, data.y)) return;
      const p = state.players.get(socket.id);
      if (p) {
        p.position = { x: data.x, y: data.y };
        if (data.direction) p.direction = data.direction as Player["direction"];
        io.emit("player:move", { id: socket.id, x: data.x, y: data.y, direction: p.direction });
      }
    });

    // ─── Chat ─────────────────────────────────────
    socket.on("chat:send", (data: { content: string }) => {
      if (!data.content || data.content.length > 200) return;
      // During focus phase, only allow chat from the pomodoro starter
      if (state.pomodoro?.phase === "focus") return;
      const msg: ChatMessage = {
        id: `${socket.id}-${Date.now()}`,
        playerId: socket.id,
        playerName: name,
        content: data.content,
        timestamp: Date.now(),
      };
      io.emit("chat:message", msg);
    });

    // ─── DJ ───────────────────────────────────────
    socket.on("dj:claim", () => {
      state.dj = claimDJ(state.dj, socket.id, name);
      io.emit("dj:state", state.dj);
    });

    socket.on("dj:release", () => {
      state.dj = releaseDJ(state.dj, socket.id);
      io.emit("dj:state", state.dj);
    });

    socket.on("dj:play", () => {
      if (!isDJ(state.dj, socket.id)) return;
      state.dj = playTrack(state.dj, Date.now());
      io.emit("dj:state", state.dj);
    });

    socket.on("dj:pause", () => {
      if (!isDJ(state.dj, socket.id)) return;
      state.dj = pauseTrack(state.dj);
      io.emit("dj:state", state.dj);
    });

    socket.on("dj:next", () => {
      if (!isDJ(state.dj, socket.id)) return;
      state.dj = nextTrack(state.dj, Date.now());
      io.emit("dj:state", state.dj);
    });

    socket.on("dj:prev", () => {
      if (!isDJ(state.dj, socket.id)) return;
      state.dj = prevTrack(state.dj, Date.now());
      io.emit("dj:state", state.dj);
    });

    socket.on("dj:volume", (data: { volume: number }) => {
      if (!isDJ(state.dj, socket.id)) return;
      state.dj = setVolume(state.dj, data.volume);
      io.emit("dj:state", state.dj);
    });

    socket.on("dj:addtrack", (data: { url: string }) => {
      if (!isDJ(state.dj, socket.id)) return;
      if (!data.url || typeof data.url !== "string") return;
      state.dj = addTrackFromUrl(state.dj, data.url);
      io.emit("dj:state", state.dj);
    });

    socket.on("dj:updatetitle", (data: { youtubeId: string; title: string }) => {
      // Anyone can send title updates (fetched from YouTube API client-side)
      state.dj = updateTrackTitle(state.dj, data.youtubeId, data.title);
      io.emit("dj:state", state.dj);
    });

    // ─── Pomodoro ─────────────────────────────────
    socket.on("pomodoro:start", (data?: { preset?: "default" | "long" }) => {
      if (state.pomodoro) return; // Already running
      const config: PomodoroConfig = data?.preset === "long" ? LONG_CONFIG : DEFAULT_CONFIG;
      state.pomodoro = createPomodoroState(socket.id, config, Date.now());
      io.emit("pomodoro:update", state.pomodoro);
      startPomodoroTimer();
    });

    socket.on("pomodoro:stop", () => {
      // Only the person who started or if nobody cares
      if (state.pomodoro && (state.pomodoro.startedBy === socket.id || state.players.size <= 1)) {
        state.pomodoro = null;
        io.emit("pomodoro:end");
        stopPomodoroTimer();
      }
    });

    // ─── WebRTC ───────────────────────────────────
    socket.on("peer:id", (data: { peerId: string }) => {
      socket.broadcast.emit("peer:id", { playerId: socket.id, peerId: data.peerId });
    });

    // ─── Disconnect ───────────────────────────────
    socket.on("disconnect", () => {
      state.players.delete(socket.id);
      io.emit("player:leave", socket.id);

      // Release DJ if the DJ disconnects
      if (isDJ(state.dj, socket.id)) {
        state.dj = releaseDJ(state.dj, socket.id);
        io.emit("dj:state", state.dj);
      }

      // Stop pomodoro if starter disconnects
      if (state.pomodoro?.startedBy === socket.id) {
        state.pomodoro = null;
        io.emit("pomodoro:end");
        stopPomodoroTimer();
      }
    });
  });

  return io;
}

function isValidPosition(x: number, y: number): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    x < 10 &&
    y >= 0 &&
    y < 10
  );
}
