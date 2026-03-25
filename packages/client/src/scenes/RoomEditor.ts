import Phaser from "phaser";
import {
  gridToScreen,
  screenToGrid,
  getDepth,
  TILE_WIDTH,
  TILE_HEIGHT,
} from "@cocoworking/shared";

const A = "assets/tinyhouse";
const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 10;

// All available textures the user can place
const PALETTE = [
  "desk", "desk-b",
  "chair-a", "chair-b", "chair-c", "chair-d",
  "gchair-a", "gchair-b", "gchair-c", "gchair-d",
  "sofa-a", "sofa-b", "pillow",
  "imac-a", "imac-b", "keyboard", "pc-tower", "wacom", "bended-screen",
  "plant-1", "plant-2", "cactus-1", "cactus-2", "sunflower",
  "carpet",
];

// Texture variant groups for rotation
const ROTATIONS: Record<string, string[]> = {
  "chair-a": ["chair-a", "chair-b", "chair-c", "chair-d"],
  "chair-b": ["chair-a", "chair-b", "chair-c", "chair-d"],
  "chair-c": ["chair-a", "chair-b", "chair-c", "chair-d"],
  "chair-d": ["chair-a", "chair-b", "chair-c", "chair-d"],
  "gchair-a": ["gchair-a", "gchair-b", "gchair-c", "gchair-d"],
  "gchair-b": ["gchair-a", "gchair-b", "gchair-c", "gchair-d"],
  "gchair-c": ["gchair-a", "gchair-b", "gchair-c", "gchair-d"],
  "gchair-d": ["gchair-a", "gchair-b", "gchair-c", "gchair-d"],
  "sofa-a": ["sofa-a", "sofa-b"],
  "sofa-b": ["sofa-a", "sofa-b"],
  "desk": ["desk", "desk-b"],
  "desk-b": ["desk", "desk-b"],
  "imac-a": ["imac-a", "imac-b"],
  "imac-b": ["imac-a", "imac-b"],
};

interface FurnitureItem {
  sprite: Phaser.GameObjects.Image;
  name: string;
  gridX: number;
  gridY: number;
  originX: number;
  originY: number;
  yOffset: number;
  depthOffset: number;
}

export class RoomEditor extends Phaser.Scene {
  private offsetX = 0;
  private offsetY = 0;
  private items: FurnitureItem[] = [];
  private selectedItem: FurnitureItem | null = null;
  private infoText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private paletteIndex = 0;

  constructor() {
    super({ key: "RoomEditor" });
  }

  preload() {
    const bar = this.add.graphics();
    this.load.on("progress", (v: number) => {
      bar.clear().fillStyle(0x6c5ce7, 1).fillRect(this.scale.width / 2 - 100, this.scale.height / 2, 200 * v, 6);
    });
    this.load.on("complete", () => bar.destroy());

    this.load.image("floor-wood", `${A}/floors/floor_wood.png`);
    this.load.image("floor-dark", `${A}/floors/floor_wood_dark.png`);
    this.load.image("wall-left", `${A}/walls/wall_brick.png`);
    this.load.image("wall-back", `${A}/walls/wall_brick2.png`);
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
    this.load.image("imac-a", `${A}/pc/imac_a.png`);
    this.load.image("imac-b", `${A}/pc/imac_b.png`);
    this.load.image("keyboard", `${A}/pc/keyboard.png`);
    this.load.image("pc-tower", `${A}/pc/pc_tower.png`);
    this.load.image("wacom", `${A}/pc/wacom.png`);
    this.load.image("bended-screen", `${A}/pc/bended_screen.png`);
    this.load.image("plant-1", `${A}/decor/plant_1.png`);
    this.load.image("plant-2", `${A}/decor/plant_2.png`);
    this.load.image("cactus-1", `${A}/decor/cactus_1.png`);
    this.load.image("cactus-2", `${A}/decor/cactus_2.png`);
    this.load.image("sunflower", `${A}/decor/sunflower.png`);
    this.load.image("carpet", `${A}/decor/carpet.png`);
  }

  create() {
    this.offsetX = this.scale.width / 2;
    this.offsetY = 150;

    // Floor
    for (let x = 0; x < ROOM_WIDTH; x++) {
      for (let y = 0; y < ROOM_HEIGHT; y++) {
        const s = gridToScreen({ x, y });
        this.add.image(s.screenX + this.offsetX, s.screenY + this.offsetY,
          (x + y) % 2 === 0 ? "floor-wood" : "floor-dark")
          .setOrigin(0.5, 0.5).setDepth(0);
      }
    }

    // Walls
    for (let y = 0; y < ROOM_HEIGHT; y++) {
      const s = gridToScreen({ x: 0, y });
      this.add.image(s.screenX + this.offsetX - TILE_WIDTH / 4, s.screenY + this.offsetY, "wall-left")
        .setOrigin(0.5, 1.0).setDepth(0);
    }
    for (let x = 0; x < ROOM_WIDTH; x++) {
      const s = gridToScreen({ x, y: 0 });
      this.add.image(s.screenX + this.offsetX + TILE_WIDTH / 4, s.screenY + this.offsetY, "wall-back")
        .setOrigin(0.5, 1.0).setDepth(0);
    }

    // Grid coordinates
    for (let x = 0; x < ROOM_WIDTH; x++) {
      for (let y = 0; y < ROOM_HEIGHT; y++) {
        const s = gridToScreen({ x, y });
        this.add.text(s.screenX + this.offsetX, s.screenY + this.offsetY, `${x},${y}`, {
          fontSize: "8px", fontFamily: "monospace", color: "#ffffff55",
        }).setOrigin(0.5).setDepth(999);
      }
    }

    // Default furniture
    this.addItem("carpet", 5, 5, 0.5, 0.5, 0, 0.1);
    this.addItem("desk", 2, 2, 0.5, 0.75, 0, 0);
    this.addItem("imac-a", 2, 2, 0.5, 1.0, -28, 0.5);
    this.addItem("gchair-d", 3, 2, 0.5, 0.85, 0, 0);
    this.addItem("desk-b", 2, 6, 0.5, 0.75, 0, 0);
    this.addItem("imac-b", 2, 6, 0.5, 1.0, -28, 0.5);
    this.addItem("keyboard", 2, 7, 0.5, 1.0, -28, 0.5);
    this.addItem("gchair-c", 3, 6, 0.5, 0.85, 0, 0);
    this.addItem("desk", 7, 2, 0.5, 0.75, 0, 0);
    this.addItem("bended-screen", 7, 2, 0.5, 1.0, -28, 0.5);
    this.addItem("gchair-d", 8, 2, 0.5, 0.85, 0, 0);
    this.addItem("desk-b", 7, 6, 0.5, 0.75, 0, 0);
    this.addItem("imac-a", 7, 6, 0.5, 1.0, -28, 0.5);
    this.addItem("wacom", 7, 7, 0.5, 1.0, -28, 0.5);
    this.addItem("gchair-c", 8, 6, 0.5, 0.85, 0, 0);
    this.addItem("sofa-a", 8, 5, 0.5, 0.75, 0, 0);
    this.addItem("plant-1", 0, 0, 0.5, 0.8, 0, 0.5);
    this.addItem("cactus-1", 9, 0, 0.5, 0.8, 0, 0.5);
    this.addItem("plant-2", 0, 9, 0.5, 0.8, 0, 0.5);
    this.addItem("sunflower", 9, 9, 0.5, 0.8, 0, 0.5);
    this.addItem("cactus-2", 5, 0, 0.5, 0.8, 0, 0.5);

    // UI
    this.infoText = this.add.text(10, 10, "", {
      fontSize: "11px", fontFamily: "monospace", color: "#feca57",
      backgroundColor: "#000000dd", padding: { x: 8, y: 6 },
      lineSpacing: 4,
    }).setDepth(1001).setScrollFactor(0);

    this.helpText = this.add.text(10, this.scale.height - 10, [
      "ROOM EDITOR",
      "Clic      — selectionner",
      "Drag      — deplacer",
      "R         — tourner (chaises, desks, sofas)",
      "Suppr/Del — supprimer",
      "N         — ajouter un meuble (parcourir palette)",
      "Haut/Bas  — ajuster yOffset (hauteur)",
      "+/-       — zoom",
      "E         — exporter layout (console)",
    ].join("\n"), {
      fontSize: "10px", fontFamily: "monospace", color: "#b2bec3",
      backgroundColor: "#000000dd", padding: { x: 8, y: 6 },
      lineSpacing: 3,
    }).setOrigin(0, 1).setDepth(1001).setScrollFactor(0);

    this.updateInfo();

    // ─── Input ────────────────────────────────────

    // Drag
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.selectedItem = this.findItemAt(p.x, p.y);
      this.items.forEach((i) => i.sprite.clearTint());
      if (this.selectedItem) {
        this.selectedItem.sprite.setTint(0xfeca57);
        this.updateInfo();
      }
    });

    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.selectedItem || !p.isDown) return;
      this.selectedItem.sprite.x = p.x;
      this.selectedItem.sprite.y = p.y;
    });

    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.selectedItem) return;
      this.snapToGrid(this.selectedItem, p.x, p.y);
      this.updateInfo();
    });

    // Zoom
    this.input.on("wheel", (_p: any, _gos: any, _dx: number, dy: number) => {
      const cam = this.cameras.main;
      const newZoom = Phaser.Math.Clamp(cam.zoom + (dy > 0 ? -0.1 : 0.1), 0.3, 3);
      cam.setZoom(newZoom);
    });

    // Keyboard
    this.input.keyboard!.on("keydown-R", () => this.rotateSelected());
    this.input.keyboard!.on("keydown-DELETE", () => this.deleteSelected());
    this.input.keyboard!.on("keydown-BACKSPACE", () => this.deleteSelected());
    this.input.keyboard!.on("keydown-N", () => this.addFromPalette());
    this.input.keyboard!.on("keydown-UP", () => this.adjustYOffset(-2));
    this.input.keyboard!.on("keydown-DOWN", () => this.adjustYOffset(2));
    this.input.keyboard!.on("keydown-E", () => this.exportLayout());
    this.input.keyboard!.on("keydown-PLUS", () => {
      this.cameras.main.setZoom(Math.min(3, this.cameras.main.zoom + 0.2));
    });
    this.input.keyboard!.on("keydown-MINUS", () => {
      this.cameras.main.setZoom(Math.max(0.3, this.cameras.main.zoom - 0.2));
    });
  }

  // ─── Actions ────────────────────────────────────

  private rotateSelected() {
    if (!this.selectedItem) return;
    const variants = ROTATIONS[this.selectedItem.name];
    if (!variants) return;

    const currentIdx = variants.indexOf(this.selectedItem.name);
    const nextIdx = (currentIdx + 1) % variants.length;
    const nextTexture = variants[nextIdx];

    this.selectedItem.sprite.setTexture(nextTexture);
    this.selectedItem.name = nextTexture;
    this.selectedItem.sprite.setTint(0xfeca57);
    this.updateInfo();
  }

  private deleteSelected() {
    if (!this.selectedItem) return;
    this.selectedItem.sprite.destroy();
    this.items = this.items.filter((i) => i !== this.selectedItem);
    this.selectedItem = null;
    this.updateInfo();
  }

  private addFromPalette() {
    const texture = PALETTE[this.paletteIndex % PALETTE.length];
    this.paletteIndex++;

    // Place at center of screen
    const gx = 5;
    const gy = 5;
    this.addItem(texture, gx, gy, 0.5, 0.75, 0, 0);

    const item = this.items[this.items.length - 1];
    this.items.forEach((i) => i.sprite.clearTint());
    item.sprite.setTint(0xfeca57);
    this.selectedItem = item;
    this.updateInfo();
  }

  private adjustYOffset(delta: number) {
    if (!this.selectedItem) return;
    this.selectedItem.yOffset += delta;
    this.selectedItem.sprite.y += delta;
    this.updateInfo();
  }

  private snapToGrid(item: FurnitureItem, px: number, py: number) {
    const cam = this.cameras.main;
    const worldX = (px - cam.width / 2) / cam.zoom + cam.scrollX + cam.width / 2;
    const worldY = (py - cam.height / 2) / cam.zoom + cam.scrollY + cam.height / 2;

    const grid = screenToGrid({
      screenX: worldX - this.offsetX,
      screenY: (worldY - item.yOffset) - this.offsetY,
    });
    const gx = Phaser.Math.Clamp(grid.x, 0, ROOM_WIDTH - 1);
    const gy = Phaser.Math.Clamp(grid.y, 0, ROOM_HEIGHT - 1);

    const s = gridToScreen({ x: gx, y: gy });
    item.sprite.x = s.screenX + this.offsetX;
    item.sprite.y = s.screenY + this.offsetY + item.yOffset;
    item.sprite.setDepth(getDepth({ x: gx, y: gy }) + item.depthOffset);
    item.gridX = gx;
    item.gridY = gy;
  }

  private exportLayout() {
    console.log("\n%c=== ROOM LAYOUT — Copy into CoworkingScene.drawFurniture() ===", "color: #feca57; font-weight: bold");
    for (const item of this.items) {
      const args = [
        `{ x: ${item.gridX}, y: ${item.gridY} }`,
        `"${item.name}"`,
        item.originX,
        item.originY,
        item.depthOffset,
        item.yOffset,
      ].join(", ");
      console.log(`    this.placeSprite(${args});`);
    }
    console.log("%c=== END ===\n", "color: #feca57; font-weight: bold");

    this.infoText.setText("Layout exported to console!\nCmd+Option+J to see it");
  }

  // ─── Helpers ────────────────────────────────────

  private addItem(
    texture: string, gx: number, gy: number,
    originX: number, originY: number, yOffset: number, depthOffset: number
  ) {
    const s = gridToScreen({ x: gx, y: gy });
    const sprite = this.add.image(
      s.screenX + this.offsetX,
      s.screenY + this.offsetY + yOffset,
      texture
    );
    sprite.setOrigin(originX, originY);
    sprite.setDepth(getDepth({ x: gx, y: gy }) + depthOffset);
    sprite.setInteractive({ useHandCursor: true });

    this.items.push({ sprite, name: texture, gridX: gx, gridY: gy, originX, originY, yOffset, depthOffset });
  }

  private findItemAt(x: number, y: number): FurnitureItem | null {
    let best: FurnitureItem | null = null;
    let bestDepth = -Infinity;
    for (const item of this.items) {
      const bounds = item.sprite.getBounds();
      if (bounds.contains(x, y) && item.sprite.depth > bestDepth) {
        best = item;
        bestDepth = item.sprite.depth;
      }
    }
    return best;
  }

  private updateInfo() {
    if (!this.selectedItem) {
      this.infoText.setText(`Meubles: ${this.items.length} | Zoom: ${this.cameras.main.zoom.toFixed(1)}x\nClic sur un meuble pour le selectionner`);
      return;
    }
    const i = this.selectedItem;
    this.infoText.setText([
      `Selected: ${i.name}`,
      `Grid: (${i.gridX}, ${i.gridY})`,
      `yOffset: ${i.yOffset}`,
      `origin: (${i.originX}, ${i.originY})`,
      `depthOffset: ${i.depthOffset}`,
      `Zoom: ${this.cameras.main.zoom.toFixed(1)}x`,
    ].join("\n"));
  }
}
