import { describe, it, expect } from "vitest";
import type { Player, ChatMessage } from "@cocoworking/shared";

// Unit tests for validation logic (extracted for testability)
function isValidPosition(x: number, y: number): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    x < 10 &&
    y >= 0 &&
    y < 10
  );
}

describe("isValidPosition", () => {
  it("accepts valid positions", () => {
    expect(isValidPosition(0, 0)).toBe(true);
    expect(isValidPosition(5, 5)).toBe(true);
    expect(isValidPosition(9, 9)).toBe(true);
  });

  it("rejects negative positions", () => {
    expect(isValidPosition(-1, 0)).toBe(false);
    expect(isValidPosition(0, -1)).toBe(false);
  });

  it("rejects out of bounds positions", () => {
    expect(isValidPosition(10, 0)).toBe(false);
    expect(isValidPosition(0, 10)).toBe(false);
    expect(isValidPosition(50, 50)).toBe(false);
  });

  it("rejects non-integer positions", () => {
    expect(isValidPosition(1.5, 2)).toBe(false);
    expect(isValidPosition(3, 4.7)).toBe(false);
  });
});

describe("Player type", () => {
  it("can create a valid player", () => {
    const player: Player = {
      id: "test-id",
      name: "Coco",
      position: { x: 5, y: 5 },
      direction: "south",
    };
    expect(player.name).toBe("Coco");
    expect(player.position.x).toBe(5);
  });
});

describe("ChatMessage type", () => {
  it("can create a valid chat message", () => {
    const msg: ChatMessage = {
      id: "msg-1",
      playerId: "player-1",
      playerName: "Coco",
      content: "Hello!",
      timestamp: Date.now(),
    };
    expect(msg.content).toBe("Hello!");
    expect(msg.timestamp).toBeTypeOf("number");
  });
});
