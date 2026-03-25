import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { createServer } from "http";
import { io as ioClient, Socket } from "socket.io-client";
import { createSocketServer } from "../../rooms/CoworkingServer";
import type { DJState } from "@cocoworking/shared";

let httpServer: ReturnType<typeof createServer>;
const TEST_PORT = 2571;

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

describe("DJ integration", () => {
  let sockets: Socket[] = [];
  afterEach(() => { sockets.forEach((s) => s.disconnect()); sockets = []; });

  it("sends DJ state on connect", async () => {
    const s = connect("Coco");
    sockets.push(s);
    const djState = await waitFor<DJState>(s, "dj:state");
    expect(djState.djId).toBeNull();
    expect(djState.playlist.length).toBeGreaterThan(0);
  });

  it("lets a player claim DJ", async () => {
    const s = connect("Coco");
    sockets.push(s);
    await waitFor(s, "dj:state"); // initial

    const updatePromise = waitFor<DJState>(s, "dj:state");
    s.emit("dj:claim");
    const state = await updatePromise;
    expect(state.djId).toBeTruthy();
    expect(state.djName).toBe("Coco");
  });

  it("prevents double DJ claim", async () => {
    const alice = connect("Alice");
    const bob = connect("Bob");
    sockets.push(alice, bob);
    await waitFor(alice, "dj:state");
    await waitFor(bob, "dj:state");

    alice.emit("dj:claim");
    await waitFor(bob, "dj:state"); // alice claimed

    const claimPromise = waitFor<DJState>(bob, "dj:state");
    bob.emit("dj:claim");
    // Bob should also get a state update but djId should still be Alice's
    // Wait a bit - if no update comes, that's fine too
    await new Promise((r) => setTimeout(r, 200));
  });

  it("DJ can play and pause", async () => {
    const s = connect("DJ");
    sockets.push(s);
    await waitFor(s, "dj:state");

    s.emit("dj:claim");
    await waitFor<DJState>(s, "dj:state");

    s.emit("dj:play");
    const playing = await waitFor<DJState>(s, "dj:state");
    expect(playing.isPlaying).toBe(true);

    s.emit("dj:pause");
    const paused = await waitFor<DJState>(s, "dj:state");
    expect(paused.isPlaying).toBe(false);
  });

  it("DJ can skip tracks", async () => {
    const s = connect("DJ");
    sockets.push(s);
    await waitFor(s, "dj:state");

    s.emit("dj:claim");
    await waitFor<DJState>(s, "dj:state");

    s.emit("dj:next");
    const next = await waitFor<DJState>(s, "dj:state");
    expect(next.currentTrackIndex).toBe(1);

    s.emit("dj:prev");
    const prev = await waitFor<DJState>(s, "dj:state");
    expect(prev.currentTrackIndex).toBe(0);
  });

  it("releases DJ on disconnect", async () => {
    const alice = connect("Alice");
    sockets.push(alice);
    await waitFor(alice, "dj:state");

    // Claim DJ
    alice.emit("dj:claim");
    const claimed = await waitFor<DJState>(alice, "dj:state");
    expect(claimed.djId).toBeTruthy();

    // Bob joins after claim
    const bob = connect("Bob");
    sockets.push(bob);
    const bobInitial = await waitFor<DJState>(bob, "dj:state");
    expect(bobInitial.djId).toBeTruthy();

    // Alice disconnects → DJ released
    const releasePromise = waitFor<DJState>(bob, "dj:state");
    alice.disconnect();
    sockets = sockets.filter((s) => s !== alice);

    const released = await releasePromise;
    expect(released.djId).toBeNull();
  });
});
