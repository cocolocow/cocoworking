import type { Position } from "./types";

/**
 * Manhattan distance between two grid positions.
 */
export function gridDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if two players are close enough for audio/video.
 * Default proximity radius: 3 tiles.
 */
export function isInProximity(a: Position, b: Position, radius = 3): boolean {
  return gridDistance(a, b) <= radius;
}

/**
 * Audio volume based on distance (1.0 = max, 0.0 = silent).
 * Falls off linearly within the radius.
 */
export function proximityVolume(a: Position, b: Position, radius = 3): number {
  const dist = gridDistance(a, b);
  if (dist > radius) return 0;
  if (dist === 0) return 1;
  return 1 - dist / (radius + 1);
}
