# Coco Working

**Espace de co-working digital en pixel art isometrique.**

Un lieu de travail virtuel inspire de Habbo Hotel ou chacun peut rejoindre une salle, travailler a cote de ses collegues, ecouter de la musique ensemble et faire des sessions Pomodoro collectives.

100% navigateur. Rien a installer.

## Features

- **Salle isometrique pixel art** — meubles, bureaux, plantes, animations (chat, lava lamp, ecrans)
- **Multiplayer temps reel** — voyez les autres joueurs bouger, chatter, travailler
- **Mode DJ** — un joueur controle la musique via YouTube (playlist lo-fi, ajout de liens)
- **Pomodoro collectif** — sessions focus (25/5 ou 50/10), chat desactive pendant le focus
- **Chat** — messages en temps reel avec bulles au-dessus des avatars
- **Audio/Video proximite** — infrastructure WebRTC (PeerJS) pour visio quand on se rapproche
- **Personnages animes** — sprites pixel art avec animations walk/idle dans 4 directions
- **Controle audio local** — chaque joueur peut muter/ajuster son volume

## Stack technique

| Couche | Techno |
|---|---|
| Game engine | Phaser 3 |
| Frontend UI | React 19 + TypeScript |
| Temps reel | Socket.IO |
| Video/Audio | PeerJS (WebRTC) |
| Musique | YouTube IFrame API |
| Backend | Node.js + TypeScript |
| Tests | Vitest (unit + integration) |
| Monorepo | Turborepo + pnpm |
| Bundler | Vite |

## Demarrage rapide

```bash
# Prerequis : Node.js >= 20, pnpm

# Cloner le repo
git clone https://github.com/cocolocow/cocoworking.git
cd cocoworking

# Installer les dependances
pnpm install

# Lancer le serveur (terminal 1)
pnpm --filter @cocoworking/server dev

# Lancer le client (terminal 2)
pnpm --filter @cocoworking/client dev

# Ouvrir http://localhost:3000
```

## Tests

```bash
pnpm -w run test          # Tous les tests (unit + integration)
pnpm -w run test:unit     # Tests unitaires uniquement
pnpm -w run test:e2e      # Tests E2E (Playwright)
```

## Structure du projet

```
packages/
  client/          — Phaser 3 + React (Vite)
    src/
      scenes/      — CoworkingScene, RoomEditor, roomLayout.ts
      ui/          — React components (Lobby, Chat, DJPanel, PomodoroBar...)
      game-logic/  — NetworkManager, ProximityManager, YouTubePlayer
    public/
      assets/      — Pixel art sprites et tilesets
  server/          — Socket.IO server
    src/
      rooms/       — CoworkingServer (multiplayer, DJ, Pomodoro)
  shared/          — Types et logique pure (isometric, movement, proximity, DJ, Pomodoro)
```

## Assets

Les assets pixel art utilises dans ce projet sont sous licence commerciale et ne sont **pas** inclus dans la licence MIT du code source :

- **[Isometric Interiors Tileset](https://pixel-salvaje.itch.io/isometric-interiors)** par [@Pixel_Salvaje](https://pixel-salvaje.itch.io/) — meubles, sols, murs, decorations
- **[Isometric Character Animations Template](https://pixel-salvaje.itch.io/isometric-character-template-64-pixel-art)** par [@Pixel_Salvaje](https://pixel-salvaje.itch.io/) — sprites personnages avec animations walk/idle

Si vous forkez ce projet, vous devez acheter vos propres licences pour ces assets.

## Commandes utiles

| Commande | Description |
|---|---|
| `pnpm -w run dev` | Lancer client + serveur |
| `pnpm -w run test` | Lancer tous les tests |
| `pnpm -w run build` | Build production |
| `pnpm --filter @cocoworking/client lint` | Type-check le client |
| `http://localhost:3000/?editor` | Ouvrir l'editeur de salle |

## Contribuer

Les contributions sont les bienvenues ! Ce projet est open source sous licence MIT.

1. Fork le repo
2. Cree une branche (`git checkout -b feature/ma-feature`)
3. Commit tes changements
4. Push et ouvre une PR

## Roadmap

- [ ] Rooms multiples (creer/rejoindre des salles)
- [ ] Personnages custom (vetements, cheveux, accessoires)
- [ ] Auth + profils persistants
- [ ] Deploiement cloud
- [ ] Room editor in-game (drag & drop meubles)
- [ ] Sons (pas, notifications, ambiance)
- [ ] Support mobile (touch controls)

## Licence

Code source : [MIT](LICENSE)

Assets pixel art : licences commerciales separees (voir section Assets)

---

Fait avec le coeur par [Coco](https://github.com/cocolocow) et [Claude Code](https://claude.com/claude-code)
