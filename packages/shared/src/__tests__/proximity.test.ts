import { describe, it, expect } from "vitest";
import { gridDistance, isInProximity, proximityVolume } from "../proximity";

describe("gridDistance", () => {
  it("returns 0 for same position", () => {
    expect(gridDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it("returns manhattan distance", () => {
    expect(gridDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
    expect(gridDistance({ x: 2, y: 3 }, { x: 5, y: 1 })).toBe(5);
  });

  it("is symmetric", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 4, y: 6 };
    expect(gridDistance(a, b)).toBe(gridDistance(b, a));
  });
});

describe("isInProximity", () => {
  it("same tile is always in proximity", () => {
    expect(isInProximity({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(true);
  });

  it("adjacent tiles are in proximity", () => {
    expect(isInProximity({ x: 5, y: 5 }, { x: 6, y: 5 })).toBe(true);
  });

  it("tiles within radius are in proximity", () => {
    expect(isInProximity({ x: 0, y: 0 }, { x: 2, y: 1 })).toBe(true); // dist=3
  });

  it("tiles beyond radius are not in proximity", () => {
    expect(isInProximity({ x: 0, y: 0 }, { x: 3, y: 1 })).toBe(false); // dist=4
  });

  it("respects custom radius", () => {
    expect(isInProximity({ x: 0, y: 0 }, { x: 5, y: 0 }, 5)).toBe(true);
    expect(isInProximity({ x: 0, y: 0 }, { x: 5, y: 0 }, 4)).toBe(false);
  });
});

describe("proximityVolume", () => {
  it("returns 1.0 at same position", () => {
    expect(proximityVolume({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(1);
  });

  it("returns 0 beyond radius", () => {
    expect(proximityVolume({ x: 0, y: 0 }, { x: 5, y: 5 })).toBe(0);
  });

  it("decreases with distance", () => {
    const v1 = proximityVolume({ x: 0, y: 0 }, { x: 1, y: 0 });
    const v2 = proximityVolume({ x: 0, y: 0 }, { x: 2, y: 0 });
    const v3 = proximityVolume({ x: 0, y: 0 }, { x: 3, y: 0 });
    expect(v1).toBeGreaterThan(v2);
    expect(v2).toBeGreaterThan(v3);
    expect(v3).toBeGreaterThan(0);
  });

  it("all values are between 0 and 1", () => {
    for (let d = 0; d <= 5; d++) {
      const v = proximityVolume({ x: 0, y: 0 }, { x: d, y: 0 });
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
