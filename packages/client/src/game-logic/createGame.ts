import Phaser from "phaser";
import { CoworkingScene } from "../scenes/CoworkingScene";

export function createGame(
  parent: HTMLElement,
  playerName: string,
  playerColor: number
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#1a1a2e",
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [],
  });

  // Add scene with init data
  game.scene.add("CoworkingScene", CoworkingScene, true, {
    playerName,
    playerColor,
  });

  return game;
}
