import React, { useState, useCallback } from "react";

interface AudioControlProps {
  onVolumeChange: (volume: number) => void;
  onMuteToggle: (muted: boolean) => void;
}

export function AudioControl({ onVolumeChange, onMuteToggle }: AudioControlProps) {
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(50);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    onVolumeChange(v);
    onMuteToggle(v === 0);
  }, [onVolumeChange, onMuteToggle]);

  const toggleMute = useCallback(() => {
    if (muted) {
      setMuted(false);
      setVolume(prevVolume || 50);
      onVolumeChange(prevVolume || 50);
      onMuteToggle(false);
    } else {
      setPrevVolume(volume);
      setMuted(true);
      setVolume(0);
      onVolumeChange(0);
      onMuteToggle(true);
    }
  }, [muted, volume, prevVolume, onVolumeChange, onMuteToggle]);

  return (
    <div style={styles.container}>
      <button onClick={toggleMute} style={styles.muteBtn} title={muted ? "Unmute" : "Mute"}>
        {muted || volume === 0 ? "🔇" : volume < 30 ? "🔈" : volume < 70 ? "🔉" : "🔊"}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={handleVolumeChange}
        style={styles.slider}
        title={`Volume: ${volume}%`}
      />
      <span style={styles.value}>{volume}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: 16,
    left: 290,
    background: "rgba(0, 0, 0, 0.75)",
    borderRadius: 8,
    padding: "6px 10px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    zIndex: 50,
  },
  muteBtn: {
    background: "none",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },
  slider: {
    width: 80,
    height: 4,
    accentColor: "#6c5ce7",
  },
  value: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#636e72",
    width: 20,
    textAlign: "right" as const,
  },
};
