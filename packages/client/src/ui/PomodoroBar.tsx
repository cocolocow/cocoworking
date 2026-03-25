import React, { useEffect, useState } from "react";
import type { PomodoroState } from "@cocoworking/shared";
import { getRemainingFormatted, getProgressPercent } from "@cocoworking/shared";

interface PomodoroBarProps {
  pomodoro: PomodoroState | null;
  onStart: (preset: "default" | "long") => void;
  onStop: () => void;
  canStop: boolean; // only starter can stop
}

export function PomodoroBar({ pomodoro, onStart, onStop, canStop }: PomodoroBarProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!pomodoro) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [pomodoro]);

  // No active pomodoro — show start buttons
  if (!pomodoro) {
    return (
      <div style={styles.container}>
        <span style={styles.label}>Pomodoro</span>
        <button onClick={() => onStart("default")} style={styles.btn}>
          25/5
        </button>
        <button onClick={() => onStart("long")} style={styles.btn}>
          50/10
        </button>
      </div>
    );
  }

  const remaining = getRemainingFormatted(pomodoro, now);
  const progress = getProgressPercent(pomodoro, now);
  const isFocus = pomodoro.phase === "focus";

  return (
    <div style={{
      ...styles.container,
      borderColor: isFocus ? "rgba(255, 107, 107, 0.4)" : "rgba(0, 184, 148, 0.4)",
    }}>
      <div style={styles.phaseRow}>
        <span style={{
          ...styles.phaseBadge,
          background: isFocus ? "rgba(255, 107, 107, 0.2)" : "rgba(0, 184, 148, 0.2)",
          color: isFocus ? "#ff6b6b" : "#00b894",
        }}>
          {isFocus ? "FOCUS" : "PAUSE"}
        </span>
        <span style={styles.timer}>{remaining}</span>
        {canStop && (
          <button onClick={onStop} style={styles.stopBtn}>Stop</button>
        )}
      </div>

      {/* Progress bar */}
      <div style={styles.progressBg}>
        <div style={{
          ...styles.progressFill,
          width: `${progress}%`,
          background: isFocus ? "#ff6b6b" : "#00b894",
        }} />
      </div>

      <div style={styles.hint}>
        {isFocus ? "Focus mode — chat disabled" : "Break — cameras on, chat away!"}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0, 0, 0, 0.85)",
    borderRadius: 10,
    padding: "10px 18px",
    fontFamily: "monospace",
    fontSize: 12,
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    zIndex: 50,
  },
  label: {
    fontSize: 11,
    color: "#b2bec3",
    fontWeight: "bold",
  },
  btn: {
    background: "rgba(108, 92, 231, 0.3)",
    border: "1px solid rgba(108, 92, 231, 0.5)",
    color: "#fff",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "monospace",
  },
  phaseRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  phaseBadge: {
    padding: "3px 8px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  timer: {
    fontSize: 22,
    fontWeight: "bold",
    fontVariantNumeric: "tabular-nums",
    flex: 1,
    textAlign: "center",
  },
  stopBtn: {
    background: "rgba(255, 107, 107, 0.2)",
    border: "1px solid rgba(255, 107, 107, 0.4)",
    color: "#ff6b6b",
    borderRadius: 4,
    padding: "4px 10px",
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "monospace",
  },
  progressBg: {
    width: "100%",
    height: 3,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 1s linear",
  },
  hint: {
    fontSize: 9,
    color: "#636e72",
    marginTop: 4,
    textAlign: "center",
    width: "100%",
  },
};
