import React, { useEffect, useRef, useState, useCallback } from "react";
import { createGame } from "../game-logic/createGame";
import { CoworkingScene } from "../scenes/CoworkingScene";
import { Lobby } from "./Lobby";
import { Chat } from "./Chat";
import { PlayerCount } from "./PlayerCount";
import { DJPanel } from "./DJPanel";
import { PomodoroBar } from "./PomodoroBar";
import type { ChatMessage, DJState, PomodoroState } from "@cocoworking/shared";
import { createDJState } from "@cocoworking/shared";

export function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<CoworkingScene | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

        // Get socket ID once connected
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

  // DJ controls
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
      />
    </>
  );
}
