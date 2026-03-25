import React, { useEffect, useRef, useState, useCallback } from "react";
import { createGame } from "../game-logic/createGame";
import { CoworkingScene } from "../scenes/CoworkingScene";
import { YouTubePlayer } from "../game-logic/YouTubePlayer";
import { Lobby } from "./Lobby";
import { Chat } from "./Chat";
import { PlayerCount } from "./PlayerCount";
import { DJPanel } from "./DJPanel";
import { PomodoroBar } from "./PomodoroBar";
import { AudioControl } from "./AudioControl";
import type { ChatMessage, DJState, PomodoroState } from "@cocoworking/shared";
import { createDJState } from "@cocoworking/shared";

export function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<CoworkingScene | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);

  const [inLobby, setInLobby] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [djState, setDJState] = useState<DJState>(createDJState());
  const [pomodoro, setPomodoro] = useState<PomodoroState | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);

  const joinDataRef = useRef<{ name: string; color: number } | null>(null);

  const handleJoin = useCallback((name: string, color: number) => {
    joinDataRef.current = { name, color };
    setInLobby(false);
  }, []);

  useEffect(() => {
    if (inLobby || !containerRef.current || gameRef.current) return;
    const { name, color } = joinDataRef.current!;

    gameRef.current = createGame(containerRef.current, name, color);

    const checkScene = setInterval(() => {
      const scene = gameRef.current?.scene.getScene("CoworkingScene") as CoworkingScene | null;
      if (scene && scene.setChatCallback) {
        clearInterval(checkScene);
        sceneRef.current = scene;

        scene.setChatCallback((msgs) => setMessages([...msgs]));
        scene.setPlayerCountCallback((n) => setPlayerCount(n));
        scene.setDJCallback((s) => setDJState({ ...s }));
        scene.setPomodoroCallbacks(
          (s) => setPomodoro({ ...s }),
          () => setPomodoro(null),
        );

        const poll = setInterval(() => {
          const id = scene.getNetwork()?.getSocketId();
          if (id) { setSocketId(id); clearInterval(poll); }
        }, 200);
      }
    }, 100);

    return () => {
      clearInterval(checkScene);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [inLobby]);

  const handleSendChat = useCallback((content: string) => {
    sceneRef.current?.sendChat(content);
  }, []);

  const handleLocalVolume = useCallback((volume: number) => {
    ytPlayerRef.current?.setVolume(volume);
  }, []);

  const handleMuteToggle = useCallback((muted: boolean) => {
    ytPlayerRef.current?.setVolume(muted ? 0 : 50);
  }, []);

  const net = () => sceneRef.current?.getNetwork();

  if (inLobby) {
    return <Lobby onJoin={handleJoin} />;
  }

  const isLocalDJ = djState.djId === socketId;
  const canStopPomodoro = pomodoro?.startedBy === socketId;
  const isFocusMode = pomodoro?.phase === "focus";

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      <PlayerCount count={playerCount} />

      <a
        href="https://github.com/cocolocow/cocoworking"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "6px 12px",
          fontFamily: "monospace", fontSize: 11, color: "#fff",
          textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
          zIndex: 50,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        GitHub
      </a>

      <PomodoroBar
        pomodoro={pomodoro}
        onStart={(preset) => net()?.startPomodoro(preset)}
        onStop={() => net()?.stopPomodoro()}
        canStop={canStopPomodoro ?? false}
      />

      {!isFocusMode && (
        <Chat messages={messages} onSend={handleSendChat} />
      )}

      <DJPanel
        djState={djState}
        isLocalDJ={isLocalDJ}
        onClaim={() => net()?.claimDJ()}
        onRelease={() => net()?.releaseDJ()}
        onPlay={() => net()?.djPlay()}
        onPause={() => net()?.djPause()}
        onNext={() => net()?.djNext()}
        onPrev={() => net()?.djPrev()}
        onVolume={(v) => net()?.djVolume(v)}
        onAddTrack={(url) => net()?.djAddTrack(url)}
        onUpdateTitle={(id, title) => net()?.djUpdateTitle(id, title)}
        onPlayerReady={(player) => { ytPlayerRef.current = player; }}
      />

      <AudioControl
        onVolumeChange={handleLocalVolume}
        onMuteToggle={handleMuteToggle}
      />
    </>
  );
}
