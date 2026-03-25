import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { createServer } from "http";
import { io as ioClient, Socket } from "socket.io-client";
import { createSocketServer } from "../../rooms/CoworkingServer";
import type { Player, ChatMessage } from "@cocoworking/shared";

let httpServer: ReturnType<typeof createServer>;
const TEST_PORT = 2568;

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      httpServer = createServer();
      createSocketServer(httpServer);
      httpServer.listen(TEST_PORT, resolve);
    })
);

afterAll(
  () =>
    new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    })
);

function connectClient(name: string): Socket {
  return ioClient(`http://localhost:${TEST_PORT}`, {
    query: { name },
    forceNew: true,
  });
}

function waitForEvent<T = any>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (data: T) => resolve(data));
  });
}

describe("CoworkingServer integration", () => {
  let sockets: Socket[] = [];

  afterEach(() => {
    for (const s of sockets) {
      s.disconnect();
    }
    sockets = [];
  });

  it("sends room state on connect", async () => {
    const socket = connectClient("Coco");
    sockets.push(socket);

    const state = await waitForEvent<Record<string, Player>>(socket, "room:state");

    expect(state).toBeDefined();
    // Should contain at least the connecting player
    const players = Object.values(state);
    expect(players.length).toBeGreaterThanOrEqual(1);
    const self = players.find((p) => p.name === "Coco");
    expect(self).toBeDefined();
    expect(self!.position.x).toBe(5);
    expect(self!.position.y).toBe(5);
  });

  it("notifies existing players when someone joins", async () => {
    const alice = connectClient("Alice");
    sockets.push(alice);
    await waitForEvent(alice, "room:state");

    const joinPromise = waitForEvent<Player>(alice, "player:join");

    const bob = connectClient("Bob");
    sockets.push(bob);

    const joined = await joinPromise;
    expect(joined.name).toBe("Bob");
    expect(joined.position.x).toBe(5);
  });

  it("syncs player movement to all clients", async () => {
    const alice = connectClient("Alice");
    sockets.push(alice);
    await waitForEvent(alice, "room:state");

    const bob = connectClient("Bob");
    sockets.push(bob);
    await waitForEvent(bob, "room:state");

    const movePromise = waitForEvent<{ id: string; x: number; y: number }>(bob, "player:move");

    alice.emit("player:move", { x: 3, y: 7 });

    const move = await movePromise;
    expect(move.x).toBe(3);
    expect(move.y).toBe(7);
  });

  it("rejects invalid positions", async () => {
    const alice = connectClient("Alice");
    sockets.push(alice);
    const state = await waitForEvent<Record<string, Player>>(alice, "room:state");

    // Listen for any move event (shouldn't fire for invalid moves)
    let moveReceived = false;
    alice.on("player:move", () => {
      moveReceived = true;
    });

    alice.emit("player:move", { x: -1, y: 50 });

    await new Promise((r) => setTimeout(r, 200));
    expect(moveReceived).toBe(false);
  });

  it("broadcasts chat messages", async () => {
    const alice = connectClient("Alice");
    sockets.push(alice);
    await waitForEvent(alice, "room:state");

    const bob = connectClient("Bob");
    sockets.push(bob);
    await waitForEvent(bob, "room:state");

    const chatPromise = waitForEvent<ChatMessage>(bob, "chat:message");

    alice.emit("chat:send", { content: "Salut Bob!" });

    const msg = await chatPromise;
    expect(msg.content).toBe("Salut Bob!");
    expect(msg.playerName).toBe("Alice");
    expect(msg.timestamp).toBeTypeOf("number");
  });

  it("notifies when a player leaves", async () => {
    const alice = connectClient("Alice");
    sockets.push(alice);
    await waitForEvent(alice, "room:state");

    // Set up join listener BEFORE bob connects
    const joinPromise = waitForEvent<Player>(alice, "player:join");
    const bob = connectClient("Bob");
    sockets.push(bob);
    await joinPromise; // alice now knows about bob

    const leavePromise = waitForEvent<string>(alice, "player:leave");
    bob.disconnect();
    sockets = sockets.filter((s) => s !== bob);

    const leftId = await leavePromise;
    expect(leftId).toBeTypeOf("string");
  });
});
