import { describe, it, expect } from "vitest";
import { gridToScreen, screenToGrid, getDepth } from "../isometric";

describe("isometric coordinate conversion", () => {
  it("converts grid origin to screen origin", () => {
    const screen = gridToScreen({ x: 0, y: 0 });
    expect(screen.screenX).toBe(0);
    expect(screen.screenY).toBe(0);
  });

  it("converts grid (1, 0) to correct screen position", () => {
    const screen = gridToScreen({ x: 1, y: 0 });
    expect(screen.screenX).toBe(32); // TILE_WIDTH / 2
    expect(screen.screenY).toBe(16); // TILE_HEIGHT / 2
  });

  it("converts grid (0, 1) to correct screen position", () => {
    const screen = gridToScreen({ x: 0, y: 1 });
    expect(screen.screenX).toBe(-32);
    expect(screen.screenY).toBe(16);
  });

  it("roundtrips grid -> screen -> grid for integer coords", () => {
    const positions = [
      { x: 0, y: 0 },
      { x: 3, y: 5 },
      { x: 9, y: 0 },
      { x: 0, y: 9 },
      { x: 7, y: 7 },
    ];

    for (const pos of positions) {
      const screen = gridToScreen(pos);
      const back = screenToGrid(screen);
      expect(back.x).toBe(pos.x);
      expect(back.y).toBe(pos.y);
    }
  });

  it("x movement goes right-down, y movement goes left-down", () => {
    const right = gridToScreen({ x: 1, y: 0 });
    const left = gridToScreen({ x: 0, y: 1 });

    // x+ goes right on screen
    expect(right.screenX).toBeGreaterThan(0);
    // y+ goes left on screen
    expect(left.screenX).toBeLessThan(0);
    // both go down
    expect(right.screenY).toBeGreaterThan(0);
    expect(left.screenY).toBeGreaterThan(0);
  });
});

describe("depth sorting", () => {
  it("tiles further from camera have higher depth", () => {
    expect(getDepth({ x: 5, y: 5 })).toBeGreaterThan(getDepth({ x: 3, y: 3 }));
  });

  it("depth is consistent for same row", () => {
    // (3,2) and (2,3) are on the same isometric row
    expect(getDepth({ x: 3, y: 2 })).toBe(getDepth({ x: 2, y: 3 }));
  });

  it("origin has depth 0", () => {
    expect(getDepth({ x: 0, y: 0 })).toBe(0);
  });
});
