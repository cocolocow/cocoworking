export type PomodoroPhase = "idle" | "focus" | "break";

export interface PomodoroConfig {
  focusMinutes: number;
  breakMinutes: number;
}

export interface PomodoroState {
  phase: PomodoroPhase;
  startedAt: number; // timestamp ms
  endsAt: number;    // timestamp ms
  config: PomodoroConfig;
  startedBy: string; // player ID
}

export const DEFAULT_CONFIG: PomodoroConfig = {
  focusMinutes: 25,
  breakMinutes: 5,
};

export const LONG_CONFIG: PomodoroConfig = {
  focusMinutes: 50,
  breakMinutes: 10,
};

export function createPomodoroState(
  playerId: string,
  config: PomodoroConfig,
  now: number
): PomodoroState {
  return {
    phase: "focus",
    startedAt: now,
    endsAt: now + config.focusMinutes * 60 * 1000,
    config,
    startedBy: playerId,
  };
}

export function getRemainingMs(state: PomodoroState, now: number): number {
  return Math.max(0, state.endsAt - now);
}

export function getRemainingFormatted(state: PomodoroState, now: number): string {
  const ms = getRemainingMs(state, now);
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function isPhaseOver(state: PomodoroState, now: number): boolean {
  return now >= state.endsAt;
}

/**
 * Transition to next phase. Returns null if pomodoro is fully done (break ended).
 */
export function nextPhase(state: PomodoroState, now: number): PomodoroState | null {
  if (state.phase === "focus") {
    return {
      ...state,
      phase: "break",
      startedAt: now,
      endsAt: now + state.config.breakMinutes * 60 * 1000,
    };
  }
  // Break is over → pomodoro complete
  return null;
}

export function getProgressPercent(state: PomodoroState, now: number): number {
  const total = state.endsAt - state.startedAt;
  if (total <= 0) return 100;
  const elapsed = now - state.startedAt;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}
