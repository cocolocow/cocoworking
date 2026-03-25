/**
 * Room Layout Config — edit positions here, Vite hot-reloads.
 *
 * Chair orientations:
 *   gchair-a = faces SE (bas-droite)
 *   gchair-b = faces SW (bas-gauche)
 *   gchair-c = faces NE (haut-droite)
 *   gchair-d = faces NW (haut-gauche)
 */

export interface LayoutItem {
  gx: number;
  gy: number;
  texture: string;
  originX: number;
  originY: number;
  yOffset: number;
  depth: number;
  anim?: string;
}

const ON_DESK = -28;

export const ROOM_LAYOUT: LayoutItem[] = [
  // ─── Tapis ────────────────────────────────────
  { gx: 5, gy: 5, texture: "carpet", originX: 0.5, originY: 0.5, yOffset: 0, depth: 0.1 },

  // ─── Station 1 (haut-gauche) ──────────────────
  // desk faces bottom-right → chair at front (x+1), facing back toward desk (NW)
  { gx: 2, gy: 2, texture: "desk",     originX: 0.5, originY: 0.75, yOffset: 0,       depth: 0 },
  { gx: 2, gy: 2, texture: "imac-a",   originX: 0.5, originY: 1.0,  yOffset: ON_DESK, depth: 0.5 },
  { gx: 3, gy: 2, texture: "gchair-d", originX: 0.5, originY: 0.85, yOffset: 0,       depth: 0 },

  // ─── Station 2 (haut-droite) ──────────────────
  // desk-b faces bottom-left → chair at front (x+1), facing back toward desk (NW)
  { gx: 2, gy: 6, texture: "desk-b",   originX: 0.5, originY: 0.75, yOffset: 0,       depth: 0 },
  { gx: 2, gy: 6, texture: "imac-b",   originX: 0.5, originY: 1.0,  yOffset: ON_DESK, depth: 0.5 },
  { gx: 2, gy: 7, texture: "keyboard", originX: 0.5, originY: 1.0,  yOffset: ON_DESK, depth: 0.5 },
  { gx: 3, gy: 7, texture: "gchair-c", originX: 0.5, originY: 0.85, yOffset: 0,       depth: 0 },

  // ─── Station 3 (bas-gauche) ───────────────────
  { gx: 7, gy: 2, texture: "desk",          originX: 0.5, originY: 0.75, yOffset: 0,       depth: 0 },
  { gx: 7, gy: 2, texture: "bended-screen", originX: 0.5, originY: 1.0,  yOffset: ON_DESK, depth: 0.5, anim: "bscreen-anim" },
  { gx: 7, gy: 3, texture: "pc-tower",      originX: 0.3, originY: 0.85, yOffset: 0,       depth: 0.3, anim: "pctower-anim" },
  { gx: 8, gy: 2, texture: "gchair-d", originX: 0.5, originY: 0.85, yOffset: 0,       depth: 0 },

  // ─── Station 4 (bas-droite) ───────────────────
  { gx: 7, gy: 6, texture: "desk-b",   originX: 0.5, originY: 0.75, yOffset: 0,       depth: 0 },
  { gx: 7, gy: 6, texture: "imac-a",   originX: 0.5, originY: 1.0,  yOffset: ON_DESK, depth: 0.5 },
  { gx: 7, gy: 7, texture: "wacom",    originX: 0.5, originY: 1.0,  yOffset: ON_DESK, depth: 0.5 },
  { gx: 8, gy: 7, texture: "gchair-c", originX: 0.5, originY: 0.85, yOffset: 0,       depth: 0 },

  // ─── Lounge ───────────────────────────────────
  { gx: 8, gy: 5, texture: "sofa-a",  originX: 0.5, originY: 0.75, yOffset: 0, depth: 0 },
  { gx: 8, gy: 5, texture: "pillow",  originX: 0.3, originY: 0.7,  yOffset: 0, depth: 0.5 },

  // ─── Plantes ──────────────────────────────────
  { gx: 0, gy: 0, texture: "plant-1",   originX: 0.5, originY: 0.8, yOffset: 0, depth: 0.5 },
  { gx: 9, gy: 0, texture: "cactus-1",  originX: 0.5, originY: 0.8, yOffset: 0, depth: 0.5 },
  { gx: 0, gy: 9, texture: "plant-2",   originX: 0.5, originY: 0.8, yOffset: 0, depth: 0.5 },
  { gx: 9, gy: 9, texture: "sunflower", originX: 0.5, originY: 0.8, yOffset: 0, depth: 0.5 },
  { gx: 5, gy: 0, texture: "cactus-2",  originX: 0.5, originY: 0.8, yOffset: 0, depth: 0.5 },

  // ─── Animations déco ─────────────────────────
  { gx: 5, gy: 9, texture: "lava-1", originX: 0.5, originY: 0.85, yOffset: 0, depth: 0.5, anim: "lava-lamp-anim" },
  { gx: 9, gy: 4, texture: "cat-1",  originX: 0.5, originY: 0.75, yOffset: 0, depth: 0.5, anim: "cat-anim" },
];

export const OBSTACLE_POSITIONS = [
  "2,2", "2,3", "3,2",   // station 1
  "2,6", "2,7", "3,7",   // station 2
  "7,2", "7,3", "8,2",   // station 3
  "7,6", "7,7", "8,7",   // station 4
  "5,5",                   // table
  "8,5", "8,6",           // sofa
];
