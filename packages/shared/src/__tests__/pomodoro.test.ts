import { describe, it, expect } from "vitest";
import {
  createPomodoroState,
  getRemainingMs,
  getRemainingFormatted,
  isPhaseOver,
  nextPhase,
  getProgressPercent,
  DEFAULT_CONFIG,
  LONG_CONFIG,
} from "../pomodoro";

const NOW = 1000000;

describe("createPomodoroState", () => {
  it("creates a focus phase", () => {
    const state = createPomodoroState("player1", DEFAULT_CONFIG, NOW);
    expect(state.phase).toBe("focus");
    expect(state.startedBy).toBe("player1");
    expect(state.startedAt).toBe(NOW);
    expect(state.endsAt).toBe(NOW + 25 * 60 * 1000);
  });

  it("uses custom config", () => {
    const state = createPomodoroState("player1", LONG_CONFIG, NOW);
    expect(state.endsAt).toBe(NOW + 50 * 60 * 1000);
  });
});

describe("getRemainingMs", () => {
  it("returns full duration at start", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    expect(getRemainingMs(state, NOW)).toBe(25 * 60 * 1000);
  });

  it("decreases over time", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    expect(getRemainingMs(state, NOW + 60000)).toBe(24 * 60 * 1000);
  });

  it("never goes below 0", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    expect(getRemainingMs(state, NOW + 999999999)).toBe(0);
  });
});

describe("getRemainingFormatted", () => {
  it("formats full time", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    expect(getRemainingFormatted(state, NOW)).toBe("25:00");
  });

  it("formats partial time", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    // 1 minute 30 seconds elapsed → 23:30 remaining
    expect(getRemainingFormatted(state, NOW + 90000)).toBe("23:30");
  });

  it("formats zero", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    expect(getRemainingFormatted(state, state.endsAt + 1000)).toBe("00:00");
  });
});

describe("isPhaseOver", () => {
  it("returns false during phase", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    expect(isPhaseOver(state, NOW + 1000)).toBe(false);
  });

  it("returns true when time is up", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    expect(isPhaseOver(state, state.endsAt)).toBe(true);
    expect(isPhaseOver(state, state.endsAt + 1)).toBe(true);
  });
});

describe("nextPhase", () => {
  it("transitions focus → break", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    const breakState = nextPhase(state, state.endsAt);

    expect(breakState).not.toBeNull();
    expect(breakState!.phase).toBe("break");
    expect(breakState!.endsAt).toBe(state.endsAt + 5 * 60 * 1000);
    expect(breakState!.startedBy).toBe("p1");
  });

  it("transitions break → null (done)", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    const breakState = nextPhase(state, state.endsAt)!;
    const done = nextPhase(breakState, breakState.endsAt);

    expect(done).toBeNull();
  });
});

describe("getProgressPercent", () => {
  it("returns 0 at start", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    expect(getProgressPercent(state, NOW)).toBe(0);
  });

  it("returns 50 at halfway", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    const halfway = NOW + (state.endsAt - NOW) / 2;
    expect(getProgressPercent(state, halfway)).toBe(50);
  });

  it("returns 100 at end", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    expect(getProgressPercent(state, state.endsAt)).toBe(100);
  });

  it("clamps to 100 past end", () => {
    const state = createPomodoroState("p1", DEFAULT_CONFIG, NOW);
    expect(getProgressPercent(state, state.endsAt + 99999)).toBe(100);
  });
});
