import { describe, it, expect } from "vitest";
import {
  createDJState,
  claimDJ,
  releaseDJ,
  playTrack,
  pauseTrack,
  nextTrack,
  prevTrack,
  setVolume,
  getCurrentTrack,
  isDJ,
  extractYouTubeId,
  addTrackFromUrl,
  updateTrackTitle,
  DEFAULT_PLAYLIST,
} from "../dj";

const NOW = 1000000;

function stateWithPlaylist() {
  const state = createDJState();
  return { ...state, playlist: DEFAULT_PLAYLIST };
}

describe("createDJState", () => {
  it("creates idle state with no DJ", () => {
    const state = createDJState();
    expect(state.djId).toBeNull();
    expect(state.isPlaying).toBe(false);
    expect(state.volume).toBe(50);
  });
});

describe("claimDJ / releaseDJ", () => {
  it("lets a player claim DJ", () => {
    const state = claimDJ(createDJState(), "p1", "Coco");
    expect(state.djId).toBe("p1");
    expect(state.djName).toBe("Coco");
  });

  it("prevents double claim", () => {
    const state = claimDJ(createDJState(), "p1", "Coco");
    const state2 = claimDJ(state, "p2", "Bob");
    expect(state2.djId).toBe("p1");
  });

  it("lets DJ release", () => {
    const state = claimDJ(createDJState(), "p1", "Coco");
    const released = releaseDJ(state, "p1");
    expect(released.djId).toBeNull();
    expect(released.isPlaying).toBe(false);
  });

  it("only the DJ can release", () => {
    const state = claimDJ(createDJState(), "p1", "Coco");
    const attempt = releaseDJ(state, "p2");
    expect(attempt.djId).toBe("p1");
  });
});

describe("playback controls", () => {
  it("plays a track", () => {
    const state = playTrack(stateWithPlaylist(), NOW);
    expect(state.isPlaying).toBe(true);
    expect(state.startedAt).toBe(NOW);
  });

  it("pauses", () => {
    const playing = playTrack(stateWithPlaylist(), NOW);
    const paused = pauseTrack(playing);
    expect(paused.isPlaying).toBe(false);
  });

  it("skips to next track", () => {
    const state = playTrack(stateWithPlaylist(), NOW);
    const next = nextTrack(state, NOW + 1000);
    expect(next.currentTrackIndex).toBe(1);
    expect(next.isPlaying).toBe(true);
  });

  it("wraps around at end of playlist", () => {
    let state = stateWithPlaylist();
    state.currentTrackIndex = DEFAULT_PLAYLIST.length - 1;
    const wrapped = nextTrack(state, NOW);
    expect(wrapped.currentTrackIndex).toBe(0);
  });

  it("goes to previous track", () => {
    let state = stateWithPlaylist();
    state.currentTrackIndex = 2;
    const prev = prevTrack(state, NOW);
    expect(prev.currentTrackIndex).toBe(1);
  });

  it("wraps previous from first track", () => {
    const state = stateWithPlaylist();
    const prev = prevTrack(state, NOW);
    expect(prev.currentTrackIndex).toBe(DEFAULT_PLAYLIST.length - 1);
  });
});

describe("volume", () => {
  it("sets volume", () => {
    expect(setVolume(createDJState(), 75).volume).toBe(75);
  });

  it("clamps to 0-100", () => {
    expect(setVolume(createDJState(), -10).volume).toBe(0);
    expect(setVolume(createDJState(), 150).volume).toBe(100);
  });
});

describe("getCurrentTrack", () => {
  it("returns null with empty playlist", () => {
    expect(getCurrentTrack(createDJState())).toBeNull();
  });

  it("returns current track", () => {
    const state = stateWithPlaylist();
    const track = getCurrentTrack(state);
    expect(track).not.toBeNull();
    expect(track!.youtubeId).toBe("jfKfPfyJRdk");
  });
});

describe("isDJ", () => {
  it("returns true for the DJ", () => {
    const state = claimDJ(createDJState(), "p1", "Coco");
    expect(isDJ(state, "p1")).toBe(true);
  });

  it("returns false for others", () => {
    const state = claimDJ(createDJState(), "p1", "Coco");
    expect(isDJ(state, "p2")).toBe(false);
  });
});

describe("extractYouTubeId", () => {
  it("extracts from standard watch URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=jfKfPfyJRdk")).toBe("jfKfPfyJRdk");
  });

  it("extracts from short URL", () => {
    expect(extractYouTubeId("https://youtu.be/jfKfPfyJRdk")).toBe("jfKfPfyJRdk");
  });

  it("extracts from embed URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/embed/jfKfPfyJRdk")).toBe("jfKfPfyJRdk");
  });

  it("accepts bare video ID", () => {
    expect(extractYouTubeId("jfKfPfyJRdk")).toBe("jfKfPfyJRdk");
  });

  it("handles URL with extra params", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=jfKfPfyJRdk&list=PLx0")).toBe("jfKfPfyJRdk");
  });

  it("returns null for invalid input", () => {
    expect(extractYouTubeId("not a url")).toBeNull();
    expect(extractYouTubeId("https://google.com")).toBeNull();
    expect(extractYouTubeId("")).toBeNull();
  });
});

describe("addTrackFromUrl", () => {
  it("adds a track from YouTube URL", () => {
    const state = createDJState();
    const updated = addTrackFromUrl(state, "https://youtu.be/jfKfPfyJRdk");
    expect(updated.playlist).toHaveLength(1);
    expect(updated.playlist[0].youtubeId).toBe("jfKfPfyJRdk");
  });

  it("rejects invalid URLs", () => {
    const state = createDJState();
    const updated = addTrackFromUrl(state, "not a youtube url");
    expect(updated.playlist).toHaveLength(0);
  });

  it("prevents duplicate tracks", () => {
    let state = createDJState();
    state = addTrackFromUrl(state, "https://youtu.be/jfKfPfyJRdk");
    state = addTrackFromUrl(state, "https://youtu.be/jfKfPfyJRdk");
    expect(state.playlist).toHaveLength(1);
  });
});

describe("updateTrackTitle", () => {
  it("updates title for matching youtubeId", () => {
    let state = addTrackFromUrl(createDJState(), "https://youtu.be/jfKfPfyJRdk");
    state = updateTrackTitle(state, "jfKfPfyJRdk", "Lofi Girl Stream");
    expect(state.playlist[0].title).toBe("Lofi Girl Stream");
  });
});
