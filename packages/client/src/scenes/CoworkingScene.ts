import Phaser from "phaser";
import {
  gridToScreen,
  screenToGrid,
  getDepth,
  getMoveDelta,
  applyMove,
  isWalkable,
  posKey,
  TILE_WIDTH,
  TILE_HEIGHT,
  type KeyDirection,
} from "@cocoworking/shared";
import { NetworkManager } from "../game-logic/NetworkManager";
import { ProximityManager } from "../game-logic/ProximityManager";
import type { Player, ChatMessage, Direction } from "@cocoworking/shared";

const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 10;
const MOVE_COOLDOWN = 180; // ms between keyboard moves

const AVATAR_COLORS = [
  0xff6b6b, 0x48dbfb, 0xfeca57, 0xff9ff3,
  0x54a0ff, 0x5f27cd, 0x01a3a4, 0xf368e0,
];

const DESK_POSITIONS = [
  { x: 2, y: 2 }, { x: 2, y: 5 },
  { x: 7, y: 3 }, { x: 7, y: 6 },
];

// Obstacle set: desks block movement
const OBSTACLES = new Set(DESK_POSITIONS.map((p) => posKey(p)));

interface RemotePlayerData {
  container: Phaser.GameObjects.Container;
  gridPos: { x: number; y: number };
}

export class CoworkingScene extends Phaser.Scene {
  // Player state
  private playerContainer!: Phaser.GameObjects.Container;
  private playerGridPos = { x: 5, y: 5 };
  private playerDirection: Direction = "south";
  private playerColor = 0xff6b6b;
  private playerName = "Coco";
  private isMoving = false;
  private lastMoveTime = 0;

  // Remote players
  private remotePlayers = new Map<string, RemotePlayerData>();

  // Network
  private network!: NetworkManager;
  private proximity = new ProximityManager();

  // Camera
  private offsetX = 0;
  private offsetY = 0;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  // Chat bridge
  private chatMessages: Array<ChatMessage> = [];
  private onChatUpdate?: (messages: ChatMessage[]) => void;
  private onPlayerCountUpdate?: (count: number) => void;
  private onProximityUpdate?: (nearbyIds: string[]) => void;
  private onDJStateUpdate?: (state: any) => void;
  private onPomodoroUpdate?: (state: any) => void;
  private onPomodoroEnd?: () => void;

  constructor() {
    super({ key: "CoworkingScene" });
  }

  init(data: { playerName?: string; playerColor?: number }) {
    if (data.playerName) this.playerName = data.playerName;
    if (data.playerColor) this.playerColor = data.playerColor;
  }

  create() {
    this.offsetX = this.scale.width / 2;
    this.offsetY = 150;

    // Draw room
    this.drawWalls();
    this.drawIsometricFloor();
    this.drawFurniture();

    // Create local player
    this.playerContainer = this.createAvatarContainer(
      this.playerGridPos, this.playerColor, this.playerName, this.playerDirection
    );

    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Click to move
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isMoving) return;
      const target = screenToGrid({
        screenX: pointer.x - this.offsetX,
        screenY: pointer.y - this.offsetY,
      });
      if (this.isInBounds(target) && isWalkable(target, OBSTACLES)) {
        this.movePlayerTo(target);
        this.network?.sendMove(target.x, target.y);
        this.proximity.setLocalPosition(target);
      }
    });

    // Network
    this.connectToServer();
  }

  update(time: number) {
    if (this.isMoving) return;
    if (time - this.lastMoveTime < MOVE_COOLDOWN) return;

    const dir = this.getKeyboardDirection();
    if (!dir) return;

    const { dx, dy, direction } = getMoveDelta(dir);
    const target = applyMove(this.playerGridPos, { dx, dy }, ROOM_WIDTH, ROOM_HEIGHT);

    if (target.x === this.playerGridPos.x && target.y === this.playerGridPos.y) return;
    if (!isWalkable(target, OBSTACLES)) return;

    this.playerDirection = direction;
    this.lastMoveTime = time;
    this.movePlayerTo(target);
    this.network?.sendMove(target.x, target.y, direction);
    this.proximity.setLocalPosition(target);
  }

  setChatCallback(cb: (msgs: ChatMessage[]) => void) { this.onChatUpdate = cb; }
  setPlayerCountCallback(cb: (n: number) => void) { this.onPlayerCountUpdate = cb; }
  setProximityCallback(cb: (ids: string[]) => void) { this.onProximityUpdate = cb; }
  setDJCallback(cb: (state: any) => void) { this.onDJStateUpdate = cb; }
  setPomodoroCallbacks(onUpdate: (state: any) => void, onEnd: () => void) {
    this.onPomodoroUpdate = onUpdate;
    this.onPomodoroEnd = onEnd;
  }
  sendChat(content: string) { this.network?.sendChat(content); }
  getNetwork() { return this.network; }
  getProximityManager() { return this.proximity; }

  // ─── Network ────────────────────────────────────────

  private connectToServer() {
    const serverUrl = `http://${window.location.hostname}:2567`;

    this.network = new NetworkManager(serverUrl, this.playerName, {
      onRoomState: (players) => {
        Object.values(players).forEach((p) => {
          if (p.id !== this.network?.getSocketId()) {
            this.addRemotePlayer(p);
          }
        });
        this.updatePlayerCount();
        this.initProximity();
      },
      onPlayerJoin: (player) => { this.addRemotePlayer(player); this.updatePlayerCount(); },
      onPlayerLeave: (id) => {
        this.removeRemotePlayer(id);
        this.proximity.removeRemotePlayer(id);
        this.updatePlayerCount();
      },
      onPlayerMove: (id, x, y) => {
        this.moveRemotePlayer(id, x, y);
        const rp = this.remotePlayers.get(id);
        if (rp) this.proximity.updateRemotePlayer(id, `coco-${id}`, { x, y });
      },
      onChat: (msg) => this.handleChat(msg),
      onPeerId: (playerId, peerId) => {
        const rp = this.remotePlayers.get(playerId);
        if (rp) this.proximity.updateRemotePlayer(playerId, peerId, rp.gridPos);
      },
      onDJState: (state) => this.onDJStateUpdate?.(state),
      onPomodoroUpdate: (state) => this.onPomodoroUpdate?.(state),
      onPomodoroEnd: () => this.onPomodoroEnd?.(),
    });
  }

  private async initProximity() {
    const socketId = this.network.getSocketId();
    if (!socketId) return;

    try {
      const peerId = await this.proximity.init(socketId);
      this.network.sendPeerId(peerId);
      this.proximity.setProximityCallback((ids) => {
        this.onProximityUpdate?.(ids);
      });
    } catch (err) {
      console.warn("PeerJS init failed, proximity disabled:", err);
    }
  }

  private updatePlayerCount() {
    this.onPlayerCountUpdate?.(this.remotePlayers.size + 1);
  }

  private addRemotePlayer(player: Player) {
    if (this.remotePlayers.has(player.id)) return;
    const color = AVATAR_COLORS[Math.abs(hashCode(player.id)) % AVATAR_COLORS.length];
    const container = this.createAvatarContainer(
      player.position, color, player.name, player.direction
    );
    this.remotePlayers.set(player.id, { container, gridPos: { ...player.position } });
  }

  private removeRemotePlayer(id: string) {
    const rp = this.remotePlayers.get(id);
    if (rp) { rp.container.destroy(); this.remotePlayers.delete(id); }
  }

  private moveRemotePlayer(id: string, x: number, y: number) {
    const rp = this.remotePlayers.get(id);
    if (!rp) return;
    rp.gridPos = { x, y };
    const screen = gridToScreen({ x, y });
    this.tweens.add({
      targets: rp.container,
      x: screen.screenX + this.offsetX,
      y: screen.screenY + this.offsetY - TILE_HEIGHT,
      duration: MOVE_COOLDOWN,
      ease: "Power2",
      onComplete: () => { rp.container.setDepth(getDepth({ x, y }) + 1); },
    });
  }

  // ─── Chat ───────────────────────────────────────────

  private handleChat(msg: ChatMessage) {
    this.chatMessages.push(msg);
    if (this.chatMessages.length > 50) this.chatMessages = this.chatMessages.slice(-50);
    this.onChatUpdate?.([...this.chatMessages]);
    this.showBubble(msg.playerId, msg.content);
  }

  private showBubble(playerId: string, content: string) {
    const isLocal = playerId === this.network?.getSocketId();
    const target = isLocal ? this.playerContainer : this.remotePlayers.get(playerId)?.container;
    if (!target) return;

    const existing = target.getData("bubble") as Phaser.GameObjects.Container | null;
    existing?.destroy();

    const text = this.add.text(0, 0, content, {
      fontSize: "11px", fontFamily: "monospace", color: "#fff",
      wordWrap: { width: 134 }, align: "center",
    }).setOrigin(0.5);

    const pad = 8;
    const bg = this.add.rectangle(0, 0, text.width + pad * 2, text.height + pad * 2, 0x000000, 0.75)
      .setOrigin(0.5).setStrokeStyle(1, 0x636e72);

    const bubble = this.add.container(target.x, target.y - 55, [bg, text]).setDepth(1000);
    target.setData("bubble", bubble);

    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: bubble, alpha: 0, duration: 500,
        onComplete: () => { bubble.destroy(); target.setData("bubble", null); },
      });
    });
  }

  // ─── Input ──────────────────────────────────────────

  private getKeyboardDirection(): KeyDirection | null {
    if (this.cursors.up.isDown || this.wasd.up.isDown) return "up";
    if (this.cursors.down.isDown || this.wasd.down.isDown) return "down";
    if (this.cursors.left.isDown || this.wasd.left.isDown) return "left";
    if (this.cursors.right.isDown || this.wasd.right.isDown) return "right";
    return null;
  }

  private isInBounds(pos: { x: number; y: number }) {
    return pos.x >= 0 && pos.x < ROOM_WIDTH && pos.y >= 0 && pos.y < ROOM_HEIGHT;
  }

  // ─── Movement ───────────────────────────────────────

  private movePlayerTo(target: { x: number; y: number }) {
    this.isMoving = true;
    this.playerGridPos = target;
    const screen = gridToScreen(target);

    this.tweens.add({
      targets: this.playerContainer,
      x: screen.screenX + this.offsetX,
      y: screen.screenY + this.offsetY - TILE_HEIGHT,
      duration: MOVE_COOLDOWN,
      ease: "Power2",
      onComplete: () => {
        this.playerContainer.setDepth(getDepth(this.playerGridPos) + 1);
        this.isMoving = false;
      },
    });

    // Update bubble position if exists
    const bubble = this.playerContainer.getData("bubble") as Phaser.GameObjects.Container | null;
    if (bubble) {
      this.tweens.add({
        targets: bubble,
        x: screen.screenX + this.offsetX,
        y: screen.screenY + this.offsetY - TILE_HEIGHT - 55,
        duration: MOVE_COOLDOWN, ease: "Power2",
      });
    }
  }

  // ─── Avatar Rendering ──────────────────────────────

  private createAvatarContainer(
    pos: { x: number; y: number },
    color: number,
    name: string,
    direction: Direction,
  ): Phaser.GameObjects.Container {
    const screen = gridToScreen(pos);
    const sx = screen.screenX + this.offsetX;
    const sy = screen.screenY + this.offsetY - TILE_HEIGHT;
    const g = this.add.graphics();

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(0, 20, 20, 8);

    // Body (isometric character)
    const darker = Phaser.Display.Color.ValueToColor(color).darken(25).color;
    const lighter = Phaser.Display.Color.ValueToColor(color).lighten(15).color;

    // Torso - left face
    g.fillStyle(darker, 1);
    g.fillPoints([
      new Phaser.Geom.Point(-8, -4),
      new Phaser.Geom.Point(0, 0),
      new Phaser.Geom.Point(0, 14),
      new Phaser.Geom.Point(-8, 10),
    ], true);

    // Torso - right face
    g.fillStyle(color, 1);
    g.fillPoints([
      new Phaser.Geom.Point(8, -4),
      new Phaser.Geom.Point(0, 0),
      new Phaser.Geom.Point(0, 14),
      new Phaser.Geom.Point(8, 10),
    ], true);

    // Torso - top face
    g.fillStyle(lighter, 1);
    g.fillPoints([
      new Phaser.Geom.Point(0, -8),
      new Phaser.Geom.Point(8, -4),
      new Phaser.Geom.Point(0, 0),
      new Phaser.Geom.Point(-8, -4),
    ], true);

    // Head (isometric cube)
    const headY = -16;
    g.fillStyle(0xfad390, 1); // Skin
    g.fillPoints([
      new Phaser.Geom.Point(-6, headY + 0),
      new Phaser.Geom.Point(0, headY - 4),
      new Phaser.Geom.Point(6, headY + 0),
      new Phaser.Geom.Point(0, headY + 4),
    ], true);

    // Hair on top
    g.fillStyle(darker, 1);
    g.fillPoints([
      new Phaser.Geom.Point(-6, headY - 2),
      new Phaser.Geom.Point(0, headY - 6),
      new Phaser.Geom.Point(6, headY - 2),
      new Phaser.Geom.Point(0, headY + 0),
    ], true);

    // Eyes (two small dots based on direction)
    g.fillStyle(0x2d3436, 1);
    if (direction === "south" || direction === "east") {
      g.fillCircle(2, headY - 1, 1);
      g.fillCircle(5, headY + 0, 1);
    } else {
      g.fillCircle(-2, headY - 1, 1);
      g.fillCircle(-5, headY + 0, 1);
    }

    // Name label
    const label = this.add.text(0, -30, name, {
      fontSize: "9px", fontFamily: "monospace", color: "#ffffff",
      stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5);

    const container = this.add.container(sx, sy, [g, label]);
    container.setDepth(getDepth(pos) + 1);
    return container;
  }

  // ─── Room Rendering ─────────────────────────────────

  private drawWalls() {
    const g = this.add.graphics();
    const wallH = 40;

    // Left wall (x=0 edge)
    for (let y = 0; y < ROOM_HEIGHT; y++) {
      const s = gridToScreen({ x: 0, y });
      const sx = s.screenX + this.offsetX;
      const sy = s.screenY + this.offsetY;

      g.fillStyle(0x4a4a6a, 1);
      g.fillPoints([
        new Phaser.Geom.Point(sx - TILE_WIDTH / 2, sy),
        new Phaser.Geom.Point(sx, sy - TILE_HEIGHT / 2),
        new Phaser.Geom.Point(sx, sy - TILE_HEIGHT / 2 - wallH),
        new Phaser.Geom.Point(sx - TILE_WIDTH / 2, sy - wallH),
      ], true);
      g.lineStyle(1, 0x636e72, 0.3);
      g.strokePath();

      // Window on every 3rd tile
      if (y % 3 === 1) {
        const wx = sx - TILE_WIDTH / 4;
        const wy = sy - wallH / 2 - 4;
        g.fillStyle(0x74b9ff, 0.3);
        g.fillRect(wx - 4, wy - 6, 8, 10);
        g.lineStyle(1, 0x636e72, 0.5);
        g.strokeRect(wx - 4, wy - 6, 8, 10);
      }
    }

    // Right wall (y=0 edge)
    for (let x = 0; x < ROOM_WIDTH; x++) {
      const s = gridToScreen({ x, y: 0 });
      const sx = s.screenX + this.offsetX;
      const sy = s.screenY + this.offsetY;

      g.fillStyle(0x3a3a5a, 1);
      g.fillPoints([
        new Phaser.Geom.Point(sx, sy - TILE_HEIGHT / 2),
        new Phaser.Geom.Point(sx + TILE_WIDTH / 2, sy),
        new Phaser.Geom.Point(sx + TILE_WIDTH / 2, sy - wallH),
        new Phaser.Geom.Point(sx, sy - TILE_HEIGHT / 2 - wallH),
      ], true);
      g.lineStyle(1, 0x636e72, 0.3);
      g.strokePath();

      if (x % 3 === 1) {
        const wx = sx + TILE_WIDTH / 4;
        const wy = sy - wallH / 2 - 4;
        g.fillStyle(0x74b9ff, 0.3);
        g.fillRect(wx - 4, wy - 6, 8, 10);
        g.lineStyle(1, 0x636e72, 0.5);
        g.strokeRect(wx - 4, wy - 6, 8, 10);
      }
    }

    g.setDepth(0);
  }

  private drawIsometricFloor() {
    const g = this.add.graphics();

    for (let x = 0; x < ROOM_WIDTH; x++) {
      for (let y = 0; y < ROOM_HEIGHT; y++) {
        const s = gridToScreen({ x, y });
        const sx = s.screenX + this.offsetX;
        const sy = s.screenY + this.offsetY;

        // Warm wood-tone checkerboard
        const color = (x + y) % 2 === 0 ? 0x3d3226 : 0x4a3c2e;

        g.fillStyle(color, 1);
        g.fillPoints([
          new Phaser.Geom.Point(sx, sy - TILE_HEIGHT / 2),
          new Phaser.Geom.Point(sx + TILE_WIDTH / 2, sy),
          new Phaser.Geom.Point(sx, sy + TILE_HEIGHT / 2),
          new Phaser.Geom.Point(sx - TILE_WIDTH / 2, sy),
        ], true);
        g.lineStyle(1, 0x2d2418, 0.3);
        g.strokePath();
      }
    }

    g.setDepth(0);
  }

  private drawFurniture() {
    for (const pos of DESK_POSITIONS) {
      this.drawDesk(pos);
    }

    // Plants
    this.drawPlant({ x: 0, y: 0 });
    this.drawPlant({ x: 9, y: 0 });
    this.drawPlant({ x: 0, y: 9 });

    // Rug in the center
    this.drawRug({ x: 4, y: 4 }, 3, 3);
  }

  private drawDesk(pos: { x: number; y: number }) {
    const s = gridToScreen(pos);
    const sx = s.screenX + this.offsetX;
    const sy = s.screenY + this.offsetY;
    const g = this.add.graphics();

    // Desk top
    g.fillStyle(0x8b6914, 1);
    g.fillPoints([
      new Phaser.Geom.Point(sx, sy - TILE_HEIGHT / 2 - 8),
      new Phaser.Geom.Point(sx + TILE_WIDTH / 3, sy - 8),
      new Phaser.Geom.Point(sx, sy + TILE_HEIGHT / 2 - 8),
      new Phaser.Geom.Point(sx - TILE_WIDTH / 3, sy - 8),
    ], true);
    g.lineStyle(1, 0x6b5010, 1);
    g.strokePath();

    // Front face
    g.fillStyle(0x7a5a12, 1);
    g.fillPoints([
      new Phaser.Geom.Point(sx, sy + TILE_HEIGHT / 2 - 8),
      new Phaser.Geom.Point(sx + TILE_WIDTH / 3, sy - 8),
      new Phaser.Geom.Point(sx + TILE_WIDTH / 3, sy),
      new Phaser.Geom.Point(sx, sy + TILE_HEIGHT / 2),
    ], true);
    g.strokePath();

    // Side face
    g.fillStyle(0x6b4e10, 1);
    g.fillPoints([
      new Phaser.Geom.Point(sx, sy + TILE_HEIGHT / 2 - 8),
      new Phaser.Geom.Point(sx - TILE_WIDTH / 3, sy - 8),
      new Phaser.Geom.Point(sx - TILE_WIDTH / 3, sy),
      new Phaser.Geom.Point(sx, sy + TILE_HEIGHT / 2),
    ], true);
    g.strokePath();

    // Monitor
    g.fillStyle(0x2d3436, 1);
    g.fillRect(sx - 6, sy - TILE_HEIGHT / 2 - 20, 12, 10);
    g.fillStyle(0x74b9ff, 0.8);
    g.fillRect(sx - 5, sy - TILE_HEIGHT / 2 - 19, 10, 8);
    // Monitor stand
    g.fillStyle(0x2d3436, 1);
    g.fillRect(sx - 1, sy - TILE_HEIGHT / 2 - 10, 2, 3);

    // Chair in front (offset +1 in y direction)
    const chairS = gridToScreen({ x: pos.x, y: pos.y + 1 });
    const cx = chairS.screenX + this.offsetX;
    const cy = chairS.screenY + this.offsetY;
    g.fillStyle(0x636e72, 1);
    g.fillCircle(cx, cy - 6, 5);
    g.fillStyle(0x4a5568, 1);
    g.fillRect(cx - 2, cy - 2, 4, 4);

    g.setDepth(getDepth(pos));
  }

  private drawPlant(pos: { x: number; y: number }) {
    const s = gridToScreen(pos);
    const sx = s.screenX + this.offsetX;
    const sy = s.screenY + this.offsetY;
    const g = this.add.graphics();

    // Pot
    g.fillStyle(0xb45309, 1);
    g.fillPoints([
      new Phaser.Geom.Point(sx - 5, sy - 4),
      new Phaser.Geom.Point(sx + 5, sy - 4),
      new Phaser.Geom.Point(sx + 4, sy + 4),
      new Phaser.Geom.Point(sx - 4, sy + 4),
    ], true);

    // Leaves
    g.fillStyle(0x27ae60, 1);
    g.fillCircle(sx, sy - 10, 7);
    g.fillCircle(sx - 4, sy - 8, 5);
    g.fillCircle(sx + 4, sy - 8, 5);
    g.fillStyle(0x2ecc71, 1);
    g.fillCircle(sx + 1, sy - 12, 4);

    g.setDepth(getDepth(pos) + 0.5);
  }

  private drawRug(pos: { x: number; y: number }, w: number, h: number) {
    const g = this.add.graphics();
    g.fillStyle(0x6c3483, 0.3);

    const topLeft = gridToScreen(pos);
    const topRight = gridToScreen({ x: pos.x + w, y: pos.y });
    const bottomRight = gridToScreen({ x: pos.x + w, y: pos.y + h });
    const bottomLeft = gridToScreen({ x: pos.x, y: pos.y + h });

    g.fillPoints([
      new Phaser.Geom.Point(topLeft.screenX + this.offsetX, topLeft.screenY + this.offsetY),
      new Phaser.Geom.Point(topRight.screenX + this.offsetX, topRight.screenY + this.offsetY),
      new Phaser.Geom.Point(bottomRight.screenX + this.offsetX, bottomRight.screenY + this.offsetY),
      new Phaser.Geom.Point(bottomLeft.screenX + this.offsetX, bottomLeft.screenY + this.offsetY),
    ], true);

    g.lineStyle(1, 0x8e44ad, 0.3);
    g.strokePath();
    g.setDepth(0.5);
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
