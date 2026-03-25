import { describe, it, expect } from "vitest";
import { getMoveDelta, applyMove, isWalkable, posKey } from "../movement";

describe("getMoveDelta", () => {
  it("up moves north (y-1)", () => {
    const { dx, dy, direction } = getMoveDelta("up");
    expect(dx).toBe(0);
    expect(dy).toBe(-1);
    expect(direction).toBe("north");
  });

  it("down moves south (y+1)", () => {
    const { dx, dy, direction } = getMoveDelta("down");
    expect(dx).toBe(0);
    expect(dy).toBe(1);
    expect(direction).toBe("south");
  });

  it("left moves west (x-1)", () => {
    const { dx, dy, direction } = getMoveDelta("left");
    expect(dx).toBe(-1);
    expect(dy).toBe(0);
    expect(direction).toBe("west");
  });

  it("right moves east (x+1)", () => {
    const { dx, dy, direction } = getMoveDelta("right");
    expect(dx).toBe(1);
    expect(dy).toBe(0);
    expect(direction).toBe("east");
  });
});

describe("applyMove", () => {
  it("moves to new position", () => {
    const result = applyMove({ x: 5, y: 5 }, { dx: 1, dy: 0 }, 10, 10);
    expect(result).toEqual({ x: 6, y: 5 });
  });

  it("clamps to left boundary", () => {
    const result = applyMove({ x: 0, y: 5 }, { dx: -1, dy: 0 }, 10, 10);
    expect(result).toEqual({ x: 0, y: 5 });
  });

  it("clamps to top boundary", () => {
    const result = applyMove({ x: 5, y: 0 }, { dx: 0, dy: -1 }, 10, 10);
    expect(result).toEqual({ x: 5, y: 0 });
  });

  it("clamps to right boundary", () => {
    const result = applyMove({ x: 9, y: 5 }, { dx: 1, dy: 0 }, 10, 10);
    expect(result).toEqual({ x: 9, y: 5 });
  });

  it("clamps to bottom boundary", () => {
    const result = applyMove({ x: 5, y: 9 }, { dx: 0, dy: 1 }, 10, 10);
    expect(result).toEqual({ x: 5, y: 9 });
  });
});

describe("isWalkable", () => {
  it("returns true for empty tile", () => {
    const obstacles = new Set(["2,2", "3,3"]);
    expect(isWalkable({ x: 5, y: 5 }, obstacles)).toBe(true);
  });

  it("returns false for obstacle tile", () => {
    const obstacles = new Set(["2,2", "3,3"]);
    expect(isWalkable({ x: 2, y: 2 }, obstacles)).toBe(false);
  });
});

describe("posKey", () => {
  it("creates string key from position", () => {
    expect(posKey({ x: 3, y: 7 })).toBe("3,7");
  });
});
