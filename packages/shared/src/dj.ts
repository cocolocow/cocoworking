export interface Track {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
}

export interface DJState {
  djId: string | null;
  djName: string;
  isPlaying: boolean;
  currentTrackIndex: number;
  volume: number; // 0-100
  playlist: Track[];
  startedAt: number; // timestamp when current track started playing
}

export function createDJState(): DJState {
  return {
    djId: null,
    djName: "",
    isPlaying: false,
    currentTrackIndex: 0,
    volume: 50,
    playlist: [],
    startedAt: 0,
  };
}

export function claimDJ(state: DJState, playerId: string, playerName: string): DJState {
  if (state.djId !== null) return state;
  return { ...state, djId: playerId, djName: playerName };
}

export function releaseDJ(state: DJState, playerId: string): DJState {
  if (state.djId !== playerId) return state;
  return { ...state, djId: null, djName: "", isPlaying: false };
}

export function playTrack(state: DJState, now: number): DJState {
  if (state.playlist.length === 0) return state;
  return { ...state, isPlaying: true, startedAt: now };
}

export function pauseTrack(state: DJState): DJState {
  return { ...state, isPlaying: false };
}

export function nextTrack(state: DJState, now: number): DJState {
  if (state.playlist.length === 0) return state;
  const nextIndex = (state.currentTrackIndex + 1) % state.playlist.length;
  return { ...state, currentTrackIndex: nextIndex, startedAt: now, isPlaying: true };
}

export function prevTrack(state: DJState, now: number): DJState {
  if (state.playlist.length === 0) return state;
  const prevIndex = (state.currentTrackIndex - 1 + state.playlist.length) % state.playlist.length;
  return { ...state, currentTrackIndex: prevIndex, startedAt: now, isPlaying: true };
}

export function setVolume(state: DJState, volume: number): DJState {
  return { ...state, volume: Math.max(0, Math.min(100, volume)) };
}

export function addTrackFromUrl(state: DJState, url: string): DJState {
  const youtubeId = extractYouTubeId(url);
  if (!youtubeId) return state;
  if (state.playlist.some((t) => t.youtubeId === youtubeId)) return state;
  const track: Track = {
    id: `yt-${youtubeId}`,
    title: `YouTube ${state.playlist.length + 1}`,
    artist: "",
    youtubeId,
  };
  return { ...state, playlist: [...state.playlist, track] };
}

export function updateTrackTitle(state: DJState, youtubeId: string, title: string): DJState {
  return {
    ...state,
    playlist: state.playlist.map((t) =>
      t.youtubeId === youtubeId ? { ...t, title } : t
    ),
  };
}

export function getCurrentTrack(state: DJState): Track | null {
  if (state.playlist.length === 0) return null;
  return state.playlist[state.currentTrackIndex] ?? null;
}

export function isDJ(state: DJState, playerId: string): boolean {
  return state.djId === playerId;
}

/**
 * Extract YouTube video ID from various URL formats.
 */
export function extractYouTubeId(url: string): string | null {
  // Already a bare ID (11 chars, no slashes)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  try {
    const parsed = new URL(url);
    // youtu.be/ID
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    // youtube.com/watch?v=ID
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      // youtube.com/embed/ID or youtube.com/v/ID
      const match = parsed.pathname.match(/\/(embed|v)\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[2];
    }
  } catch {
    // Not a valid URL
  }

  return null;
}

// Curated lo-fi playlist with real YouTube video IDs
export const DEFAULT_PLAYLIST: Track[] = [
  { id: "1", title: "lofi hip hop radio - beats to relax/study to", artist: "Lofi Girl", youtubeId: "jfKfPfyJRdk" },
  { id: "2", title: "synthwave radio - beats to chill/game to", artist: "Lofi Girl", youtubeId: "4xDzrJKXOOY" },
  { id: "3", title: "jazz/lofi hip hop radio", artist: "Lofi Girl", youtubeId: "HuFYqnbVbzY" },
  { id: "4", title: "lofi hip hop radio - beats to sleep/chill to", artist: "Lofi Girl", youtubeId: "rUxyKA_-grg" },
  { id: "5", title: "coffee shop radio - 24/7 lofi hip hop", artist: "Lofi Girl", youtubeId: "lTRiuFIWV54" },
];
