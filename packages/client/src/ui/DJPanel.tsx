import React, { useState, useEffect, useRef } from "react";
import type { DJState } from "@cocoworking/shared";
import { getCurrentTrack } from "@cocoworking/shared";
import { YouTubePlayer } from "../game-logic/YouTubePlayer";

interface DJPanelProps {
  djState: DJState;
  isLocalDJ: boolean;
  onClaim: () => void;
  onRelease: () => void;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolume: (vol: number) => void;
  onAddTrack: (url: string) => void;
  onUpdateTitle: (youtubeId: string, title: string) => void;
}

export function DJPanel({
  djState, isLocalDJ, onClaim, onRelease,
  onPlay, onPause, onNext, onPrev, onVolume, onAddTrack, onUpdateTitle,
}: DJPanelProps) {
  const [urlInput, setUrlInput] = useState("");
  const playerRef = useRef<YouTubePlayer | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);

  const track = getCurrentTrack(djState);
  const hasDJ = djState.djId !== null;

  // Init YouTube player
  useEffect(() => {
    const player = new YouTubePlayer("yt-dj-player");
    playerRef.current = player;

    player.init().then(() => {
      player.setOnTitleLoaded((title) => {
        const t = getCurrentTrack(djState);
        if (t) onUpdateTitle(t.youtubeId, title);
      });
    });

    return () => { player.destroy(); };
  }, []);

  // Sync playback with DJ state
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (track && track.youtubeId !== lastTrackIdRef.current) {
      player.loadVideo(track.youtubeId);
      lastTrackIdRef.current = track.youtubeId;
    }

    if (djState.isPlaying) {
      player.play();
    } else {
      player.pause();
    }

    player.setVolume(djState.volume);
  }, [djState.isPlaying, djState.currentTrackIndex, djState.volume, track?.youtubeId]);

  // Auto-advance on track end
  useEffect(() => {
    playerRef.current?.setOnTrackEnded(() => {
      if (isLocalDJ) onNext();
    });
  }, [isLocalDJ, onNext]);

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onAddTrack(urlInput.trim());
      setUrlInput("");
    }
  };

  return (
    <div style={styles.container}>
      {/* Track info */}
      <div style={styles.trackInfo}>
        <div style={styles.icon}>{djState.isPlaying ? "♪" : "♫"}</div>
        <div style={styles.trackText}>
          {track ? (
            <>
              <div style={styles.title}>{track.title}</div>
              <div style={styles.artist}>{track.artist}</div>
            </>
          ) : (
            <div style={styles.noTrack}>Pas de musique</div>
          )}
        </div>
      </div>

      {hasDJ && <div style={styles.djBadge}>DJ: {djState.djName}</div>}

      {/* Playlist count */}
      {djState.playlist.length > 0 && (
        <div style={styles.playlistInfo}>
          {djState.currentTrackIndex + 1}/{djState.playlist.length} tracks
        </div>
      )}

      {/* Controls for DJ */}
      {isLocalDJ ? (
        <>
          <div style={styles.controls}>
            <button onClick={onPrev} style={styles.btn}>⏮</button>
            <button onClick={djState.isPlaying ? onPause : onPlay} style={styles.btnPrimary}>
              {djState.isPlaying ? "⏸" : "▶"}
            </button>
            <button onClick={onNext} style={styles.btn}>⏭</button>
            <input
              type="range" min={0} max={100}
              value={djState.volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              style={styles.slider}
            />
          </div>

          {/* Add track */}
          <form onSubmit={handleAddTrack} style={styles.addForm}>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Coller un lien YouTube..."
              style={styles.urlInput}
            />
            <button type="submit" style={styles.addBtn}>+</button>
          </form>

          <button onClick={onRelease} style={styles.btnRelease}>Quitter DJ</button>
        </>
      ) : !hasDJ ? (
        <button onClick={onClaim} style={styles.btnClaim}>Devenir DJ</button>
      ) : (
        /* Non-DJ volume control */
        <div style={styles.controls}>
          <span style={styles.volLabel}>Vol</span>
          <input
            type="range" min={0} max={100}
            value={djState.volume}
            onChange={(e) => {
              playerRef.current?.setVolume(Number(e.target.value));
            }}
            style={styles.slider}
          />
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: 16,
    left: 16,
    background: "rgba(0, 0, 0, 0.85)",
    borderRadius: 10,
    padding: "12px 14px",
    fontFamily: "monospace",
    fontSize: 12,
    color: "#fff",
    border: "1px solid rgba(108, 92, 231, 0.3)",
    minWidth: 240,
    maxWidth: 280,
  },
  trackInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  icon: { fontSize: 18, opacity: 0.6 },
  trackText: { flex: 1, minWidth: 0 },
  title: {
    fontWeight: "bold",
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  artist: { fontSize: 10, color: "#b2bec3", marginTop: 1 },
  noTrack: { fontSize: 11, color: "#636e72" },
  djBadge: {
    fontSize: 10,
    color: "#feca57",
    marginBottom: 6,
    fontWeight: "bold",
  },
  playlistInfo: {
    fontSize: 9,
    color: "#636e72",
    marginBottom: 8,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  btn: {
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "#fff",
    borderRadius: 4,
    width: 28,
    height: 28,
    cursor: "pointer",
    fontSize: 12,
  },
  btnPrimary: {
    background: "#6c5ce7",
    border: "none",
    color: "#fff",
    borderRadius: "50%",
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 14,
  },
  slider: { flex: 1, height: 4, accentColor: "#6c5ce7" },
  volLabel: { fontSize: 9, color: "#636e72" },
  addForm: {
    display: "flex",
    gap: 4,
    marginBottom: 8,
  },
  urlInput: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 4,
    color: "#fff",
    padding: "6px 8px",
    fontSize: 10,
    fontFamily: "monospace",
    outline: "none",
  },
  addBtn: {
    background: "#6c5ce7",
    border: "none",
    color: "#fff",
    borderRadius: 4,
    width: 28,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
  },
  btnRelease: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#b2bec3",
    borderRadius: 4,
    padding: "5px 0",
    fontSize: 9,
    cursor: "pointer",
    fontFamily: "monospace",
    width: "100%",
  },
  btnClaim: {
    background: "#6c5ce7",
    border: "none",
    color: "#fff",
    borderRadius: 6,
    padding: "10px 16px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
    width: "100%",
  },
};
