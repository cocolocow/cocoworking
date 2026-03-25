import type { Position, Direction } from "./types";

export type KeyDirection = "up" | "down" | "left" | "right";

/**
 * Map keyboard direction to grid movement delta and facing direction.
 * In isometric view:
 *   up    → north (x-1, y-1)  — moves toward back corner
 *   down  → south (x+1, y+1)  — moves toward front
 *   left  → west  (x-1, y+1)  — moves left on screen
 *   right → east  (x+1, y-1)  — moves right on screen
 */
export function getMoveDelta(key: KeyDirection): { dx: number; dy: number; direction: Direction } {
  switch (key) {
    case "up":
      return { dx: 0, dy: -1, direction: "north" };
    case "down":
      return { dx: 0, dy: 1, direction: "south" };
    case "left":
      return { dx: -1, dy: 0, direction: "west" };
    case "right":
      return { dx: 1, dy: 0, direction: "east" };
  }
}

/**
 * Apply a move delta to a position, clamped to room bounds.
 */
export function applyMove(
  pos: Position,
  delta: { dx: number; dy: number },
  roomWidth: number,
  roomHeight: number
): Position {
  const newX = pos.x + delta.dx;
  const newY = pos.y + delta.dy;

  if (newX < 0 || newX >= roomWidth || newY < 0 || newY >= roomHeight) {
    return pos; // Don't move out of bounds
  }

  return { x: newX, y: newY };
}

/**
 * Check if a grid position is occupied by furniture or other obstacles.
 */
export function isWalkable(
  pos: Position,
  obstacles: ReadonlySet<string>
): boolean {
  return !obstacles.has(`${pos.x},${pos.y}`);
}

export function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}
