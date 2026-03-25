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
import { ROOM_LAYOUT, OBSTACLE_POSITIONS } from "./roomLayout";

const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 10;
const MOVE_COOLDOWN = 180;

const AVATAR_COLORS = [
  0xff6b6b, 0x48dbfb, 0xfeca57, 0xff9ff3,
  0x54a0ff, 0x5f27cd, 0x01a3a4, 0xf368e0,
];

const OBSTACLES = new Set(OBSTACLE_POSITIONS);

const A = "assets/tinyhouse";

interface RemotePlayerData {
  container: Phaser.GameObjects.Container;
  gridPos: { x: number; y: number };
}

export class CoworkingScene extends Phaser.Scene {
  private playerContainer!: Phaser.GameObjects.Container;
  private playerGridPos = { x: 5, y: 5 };
  private playerDirection: Direction = "south";
  private playerColor = 0xff6b6b;
  private playerName = "Coco";
  private isMoving = false;
  private lastMoveTime = 0;

  private remotePlayers = new Map<string, RemotePlayerData>();
  private network!: NetworkManager;
  private proximity = new ProximityManager();

  private offsetX = 0;
  private offsetY = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

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

  // ─── Preload ──────────────────────────────────────

  preload() {
    // Loading bar
    const bar = this.add.graphics();
    const loadText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, "Chargement...", {
      fontSize: "14px", fontFamily: "monospace", color: "#ffffff",
    }).setOrigin(0.5);
    this.load.on("progress", (v: number) => {
      bar.clear();
      bar.fillStyle(0x6c5ce7, 1);
      bar.fillRect(this.scale.width / 2 - 150, this.scale.height / 2, 300 * v, 8);
    });
    this.load.on("complete", () => { bar.destroy(); loadText.destroy(); });

    // Floors & Walls
    this.load.image("floor-wood", `${A}/floors/floor_wood.png`);
    this.load.image("floor-dark", `${A}/floors/floor_wood_dark.png`);
    this.load.image("wall-left", `${A}/walls/wall_brick.png`);   // faces right
    this.load.image("wall-back", `${A}/walls/wall_brick2.png`);  // faces left

    // Furniture
    this.load.image("desk", `${A}/furniture/desk.png`);
    this.load.image("desk-b", `${A}/furniture/desk_b.png`);
    this.load.image("chair-a", `${A}/furniture/chair_a.png`);
    this.load.image("chair-b", `${A}/furniture/chair_b.png`);
    this.load.image("chair-c", `${A}/furniture/chair_c.png`);
    this.load.image("chair-d", `${A}/furniture/chair_d.png`);
    this.load.image("gchair-a", `${A}/furniture/gchair_a.png`);
    this.load.image("gchair-b", `${A}/furniture/gchair_b.png`);
    this.load.image("gchair-c", `${A}/furniture/gchair_c.png`);
    this.load.image("gchair-d", `${A}/furniture/gchair_d.png`);
    this.load.image("sofa-a", `${A}/furniture/sofa_a.png`);
    this.load.image("sofa-b", `${A}/furniture/sofa_b.png`);
    this.load.image("pillow", `${A}/furniture/pillow.png`);

    // PC / Monitors
    this.load.image("imac-a", `${A}/pc/imac_a.png`);
    this.load.image("imac-b", `${A}/pc/imac_b.png`);
    this.load.image("keyboard", `${A}/pc/keyboard.png`);
    this.load.image("pc-tower", `${A}/pc/pc_tower.png`);
    this.load.image("wacom", `${A}/pc/wacom.png`);

    // Decor
    this.load.image("plant-1", `${A}/decor/plant_1.png`);
    this.load.image("plant-2", `${A}/decor/plant_2.png`);
    this.load.image("cactus-1", `${A}/decor/cactus_1.png`);
    this.load.image("cactus-2", `${A}/decor/cactus_2.png`);
    this.load.image("sunflower", `${A}/decor/sunflower.png`);
    this.load.image("carpet", `${A}/decor/carpet.png`);

    // Animation frames
    for (let i = 1; i <= 25; i++) {
      this.load.image(`lava-${i}`, `${A}/animations/lava_lamp/frame_${i}.png`);
    }
    for (let i = 1; i <= 13; i++) {
      this.load.image(`macbook-${i}`, `${A}/animations/macbook/${this.getMacbookFrameName(i)}`);
    }
    for (let i = 1; i <= 18; i++) {
      this.load.image(`bscreen-${i}`, `${A}/animations/bended_screen/frame_${i}.png`);
    }
    for (let i = 1; i <= 9; i++) {
      this.load.image(`pctower-${i}`, `${A}/animations/pc_tower/frame_${i}.png`);
    }
    for (let i = 1; i <= 20; i++) {
      this.load.image(`cat-${i}`, `${A}/animations/cat/frame_${i}.png`);
    }
  }

  private getMacbookFrameName(i: number): string {
    // Files are named: macbook_1_closed_tile.png, macbook_1_open_tile.png, macbook_1_tile_ani_1.png...
    const names = [
      "macbook_1_closed_tile.png",
      "macbook_1_open_tile.png",
      "macbook_1_tile_ani_1.png", "macbook_1_tile_ani_2.png", "macbook_1_tile_ani_3.png",
      "macbook_1_tile_ani_4.png", "macbook_1_tile_ani_5.png", "macbook_1_tile_ani_6.png",
      "macbook_1_tile_ani_7.png", "macbook_1_tile_ani_8.png", "macbook_1_tile_ani_9.png",
      "macbook_1_tile_ani_10.png", "macbook_1_tile_ani_11.png",
    ];
    return names[i - 1] || names[0];
  }

  // ─── Create ───────────────────────────────────────

  create() {
    this.offsetX = this.scale.width / 2;
    this.offsetY = 150;

    // Create animations
    this.createAnimations();

    // Draw room with sprites
    this.drawFloor();
    this.drawWalls();
    this.drawFurniture();

    // Local player (still programmatic — waiting for character pack)
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

    this.connectToServer();
  }

  private createAnimations() {
    this.anims.create({
      key: "lava-lamp-anim",
      frames: Array.from({ length: 25 }, (_, i) => ({ key: `lava-${i + 1}` })),
      frameRate: 5, repeat: -1,
    });
    this.anims.create({
      key: "macbook-anim",
      frames: Array.from({ length: 11 }, (_, i) => ({ key: `macbook-${i + 3}` })),
      frameRate: 6, repeat: -1,
    });
    this.anims.create({
      key: "bscreen-anim",
      frames: Array.from({ length: 18 }, (_, i) => ({ key: `bscreen-${i + 1}` })),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: "pctower-anim",
      frames: Array.from({ length: 9 }, (_, i) => ({ key: `pctower-${i + 1}` })),
      frameRate: 4, repeat: -1,
    });
    this.anims.create({
      key: "cat-anim",
      frames: Array.from({ length: 20 }, (_, i) => ({ key: `cat-${i + 1}` })),
      frameRate: 5, repeat: -1,
    });
  }

  // ─── Floor ────────────────────────────────────────

  private drawFloor() {
    for (let x = 0; x < ROOM_WIDTH; x++) {
      for (let y = 0; y < ROOM_HEIGHT; y++) {
        const s = gridToScreen({ x, y });
        const key = (x + y) % 2 === 0 ? "floor-wood" : "floor-dark";
        const tile = this.add.image(
          s.screenX + this.offsetX,
          s.screenY + this.offsetY,
          key
        );
        tile.setOrigin(0.5, 0.5);
        tile.setDepth(0);
      }
    }
  }

  // ─── Walls ────────────────────────────────────────

  private drawWalls() {
    // Left wall (x=0 edge, along y axis) — brick faces RIGHT into the room
    for (let y = 0; y < ROOM_HEIGHT; y++) {
      const s = gridToScreen({ x: 0, y });
      // Align to the left vertex of the tile diamond
      const wall = this.add.image(
        s.screenX + this.offsetX - TILE_WIDTH / 4,
        s.screenY + this.offsetY,
        "wall-left"
      );
      wall.setOrigin(0.5, 1.0);
      wall.setDepth(0);
    }

    // Back wall (y=0 edge, along x axis) — brick faces LEFT into the room
    for (let x = 0; x < ROOM_WIDTH; x++) {
      const s = gridToScreen({ x, y: 0 });
      // Align to the top-right vertex of the tile diamond
      const wall = this.add.image(
        s.screenX + this.offsetX + TILE_WIDTH / 4,
        s.screenY + this.offsetY,
        "wall-back"
      );
      wall.setOrigin(0.5, 1.0);
      wall.setDepth(0);
    }
  }

  // ─── Furniture ────────────────────────────────────

  private drawFurniture() {
    // Carpet in lounge area (depth just above floor)
    this.placeSprite({ x: 5, y: 5 }, "carpet", 0.5, 0.5, 0.1);

    // Place all furniture from layout config (edit roomLayout.ts to reposition)
    for (const item of ROOM_LAYOUT) {
      if (item.anim) {
        this.placeAnimated(
          { x: item.gx, y: item.gy },
          item.texture, item.anim,
          item.originX, item.originY, item.depth, item.yOffset
        );
      } else {
        this.placeSprite(
          { x: item.gx, y: item.gy },
          item.texture, item.originX, item.originY, item.depth, item.yOffset
        );
      }
    }
  }

  private placeSprite(
    pos: { x: number; y: number },
    texture: string,
    originX = 0.5,
    originY = 0.75,
    depthOffset = 0,
    yOffset = 0,
  ): Phaser.GameObjects.Image {
    const s = gridToScreen(pos);
    const img = this.add.image(
      s.screenX + this.offsetX,
      s.screenY + this.offsetY + yOffset,
      texture
    );
    img.setOrigin(originX, originY);
    img.setDepth(getDepth(pos) + depthOffset);
    return img;
  }

  private placeAnimated(
    pos: { x: number; y: number },
    initialFrame: string,
    animKey: string,
    originX = 0.5,
    originY = 0.75,
    depthOffset = 0,
    yOffset = 0,
  ): Phaser.GameObjects.Sprite {
    const s = gridToScreen(pos);
    const sprite = this.add.sprite(
      s.screenX + this.offsetX,
      s.screenY + this.offsetY + yOffset,
      initialFrame
    );
    sprite.setOrigin(originX, originY);
    sprite.setDepth(getDepth(pos) + depthOffset);
    sprite.play(animKey);
    return sprite;
  }

  // ─── Update ───────────────────────────────────────

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

  // ─── Public API ───────────────────────────────────

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

  // ─── Network ──────────────────────────────────────

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
      this.proximity.setProximityCallback((ids) => { this.onProximityUpdate?.(ids); });
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

  // ─── Chat ─────────────────────────────────────────

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

  // ─── Input ────────────────────────────────────────

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

  // ─── Movement ─────────────────────────────────────

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

  // ─── Avatar (programmatic — until character pack) ─

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

    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(0, 20, 20, 8);

    const darker = Phaser.Display.Color.ValueToColor(color).darken(25).color;
    const lighter = Phaser.Display.Color.ValueToColor(color).lighten(15).color;

    g.fillStyle(darker, 1);
    g.fillPoints([
      new Phaser.Geom.Point(-8, -4), new Phaser.Geom.Point(0, 0),
      new Phaser.Geom.Point(0, 14), new Phaser.Geom.Point(-8, 10),
    ], true);

    g.fillStyle(color, 1);
    g.fillPoints([
      new Phaser.Geom.Point(8, -4), new Phaser.Geom.Point(0, 0),
      new Phaser.Geom.Point(0, 14), new Phaser.Geom.Point(8, 10),
    ], true);

    g.fillStyle(lighter, 1);
    g.fillPoints([
      new Phaser.Geom.Point(0, -8), new Phaser.Geom.Point(8, -4),
      new Phaser.Geom.Point(0, 0), new Phaser.Geom.Point(-8, -4),
    ], true);

    const headY = -16;
    g.fillStyle(0xfad390, 1);
    g.fillPoints([
      new Phaser.Geom.Point(-6, headY), new Phaser.Geom.Point(0, headY - 4),
      new Phaser.Geom.Point(6, headY), new Phaser.Geom.Point(0, headY + 4),
    ], true);

    g.fillStyle(darker, 1);
    g.fillPoints([
      new Phaser.Geom.Point(-6, headY - 2), new Phaser.Geom.Point(0, headY - 6),
      new Phaser.Geom.Point(6, headY - 2), new Phaser.Geom.Point(0, headY),
    ], true);

    g.fillStyle(0x2d3436, 1);
    if (direction === "south" || direction === "east") {
      g.fillCircle(2, headY - 1, 1);
      g.fillCircle(5, headY, 1);
    } else {
      g.fillCircle(-2, headY - 1, 1);
      g.fillCircle(-5, headY, 1);
    }

    const label = this.add.text(0, -30, name, {
      fontSize: "9px", fontFamily: "monospace", color: "#ffffff",
      stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5);

    const container = this.add.container(sx, sy, [g, label]);
    container.setDepth(getDepth(pos) + 1);
    return container;
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
