import type { Position, ScreenPosition } from "./types";

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

/**
 * Convert grid coordinates (x, y) to isometric screen coordinates.
 */
export function gridToScreen(pos: Position): ScreenPosition {
  return {
    screenX: (pos.x - pos.y) * (TILE_WIDTH / 2),
    screenY: (pos.x + pos.y) * (TILE_HEIGHT / 2),
  };
}

/**
 * Convert isometric screen coordinates back to grid coordinates.
 */
export function screenToGrid(screen: ScreenPosition): Position {
  return {
    x: Math.floor(
      screen.screenX / TILE_WIDTH + screen.screenY / TILE_HEIGHT
    ),
    y: Math.floor(
      screen.screenY / TILE_HEIGHT - screen.screenX / TILE_WIDTH
    ),
  };
}

/**
 * Calculate depth for isometric sorting.
 * Higher depth = rendered later = appears in front.
 */
export function getDepth(pos: Position): number {
  return pos.x + pos.y;
}

export { TILE_WIDTH, TILE_HEIGHT };
