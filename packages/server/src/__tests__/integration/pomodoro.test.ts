import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { createServer } from "http";
import { io as ioClient, Socket } from "socket.io-client";
import { createSocketServer } from "../../rooms/CoworkingServer";
import type { PomodoroState } from "@cocoworking/shared";

let httpServer: ReturnType<typeof createServer>;
const TEST_PORT = 2572;

beforeAll(
  () => new Promise<void>((resolve) => {
    httpServer = createServer();
    createSocketServer(httpServer);
    httpServer.listen(TEST_PORT, resolve);
  })
);

afterAll(
  () => new Promise<void>((resolve) => { httpServer.close(() => resolve()); })
);

function connect(name: string): Socket {
  return ioClient(`http://localhost:${TEST_PORT}`, { query: { name }, forceNew: true });
}

function waitFor<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => { socket.once(event, (d: T) => resolve(d)); });
}

describe("Pomodoro integration", () => {
  let sockets: Socket[] = [];
  afterEach(async () => {
    sockets.forEach((s) => s.disconnect());
    sockets = [];
    // Wait for server to process disconnects and cleanup pomodoro state
    await new Promise((r) => setTimeout(r, 150));
  });

  it("starts a pomodoro session", async () => {
    const s = connect("Coco");
    sockets.push(s);
    await waitFor(s, "room:state");

    const updatePromise = waitFor<PomodoroState>(s, "pomodoro:update");
    s.emit("pomodoro:start");
    const state = await updatePromise;

    expect(state.phase).toBe("focus");
    expect(state.config.focusMinutes).toBe(25);
    expect(state.config.breakMinutes).toBe(5);
  });

  it("broadcasts pomodoro to all players", async () => {
    const alice = connect("Alice");
    const bob = connect("Bob");
    sockets.push(alice, bob);
    await waitFor(alice, "room:state");
    await waitFor(bob, "room:state");

    const bobPromise = waitFor<PomodoroState>(bob, "pomodoro:update");
    alice.emit("pomodoro:start", { preset: "long" });
    const state = await bobPromise;

    expect(state.phase).toBe("focus");
    expect(state.config.focusMinutes).toBe(50);
  });

  it("prevents starting a second pomodoro", async () => {
    const alice = connect("Alice");
    sockets.push(alice);
    await waitFor(alice, "room:state");

    alice.emit("pomodoro:start");
    await waitFor(alice, "pomodoro:update");

    // Count how many updates alice gets after bob tries to start
    let updateCount = 0;
    alice.on("pomodoro:update", () => { updateCount++; });

    const bob = connect("Bob");
    sockets.push(bob);
    await waitFor(bob, "room:state");
    // Bob gets the existing pomodoro on connect — that's fine

    bob.emit("pomodoro:start"); // Should be silently ignored
    await new Promise((r) => setTimeout(r, 200));

    // Alice should NOT have received any new updates from bob's attempt
    expect(updateCount).toBe(0);
  });

  it("blocks chat during focus phase", async () => {
    const s = connect("Coco");
    sockets.push(s);
    await waitFor(s, "room:state");

    s.emit("pomodoro:start");
    await waitFor(s, "pomodoro:update");

    let chatReceived = false;
    s.on("chat:message", () => { chatReceived = true; });
    s.emit("chat:send", { content: "Hello" });
    await new Promise((r) => setTimeout(r, 200));

    expect(chatReceived).toBe(false);
  });

  it("starter can stop pomodoro", async () => {
    const s = connect("Coco");
    sockets.push(s);
    await waitFor(s, "room:state");

    s.emit("pomodoro:start");
    await waitFor(s, "pomodoro:update");

    const endPromise = waitFor(s, "pomodoro:end");
    s.emit("pomodoro:stop");
    await endPromise;
  });

  it("sends pomodoro state to late joiners", async () => {
    const alice = connect("Alice");
    sockets.push(alice);
    await waitFor(alice, "room:state");

    alice.emit("pomodoro:start");
    await waitFor(alice, "pomodoro:update");

    // Bob joins late
    const bob = connect("Bob");
    sockets.push(bob);
    const state = await waitFor<PomodoroState>(bob, "pomodoro:update");
    expect(state.phase).toBe("focus");
  });
});
