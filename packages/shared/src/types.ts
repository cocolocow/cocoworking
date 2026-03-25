export interface Position {
  x: number;
  y: number;
}

export interface ScreenPosition {
  screenX: number;
  screenY: number;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  direction: Direction;
}

export type Direction = "north" | "south" | "east" | "west";

export interface Room {
  id: string;
  name: string;
  ownerId: string;
  players: Map<string, Player>;
  width: number;
  height: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
}
