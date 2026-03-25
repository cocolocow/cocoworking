# Coco Working

Open source digital co-working space with isometric pixel art (Habbo Hotel inspired).

## Architecture

Monorepo (Turborepo + pnpm):
- `packages/client` — Phaser 3 + React + TypeScript (Vite)
- `packages/server` — Socket.IO + TypeScript
- `packages/shared` — Shared types and pure game logic (isometric math, movement, proximity)

## Commands

```bash
pnpm install                # Install all dependencies
pnpm -w run dev             # Start client (3000) + server (2567)
pnpm -w run test            # Run all unit + integration tests
pnpm -w run test:unit       # Unit tests only (Vitest)
pnpm -w run test:e2e        # E2E tests (Playwright)
pnpm -w run build           # Build all packages
```

## Testing (TDD)

- Unit tests: Vitest — game logic in `shared/`, validation in `server/`
- Integration tests: Vitest + socket.io-client — full server behavior
- E2E tests: Playwright (future) — full client+server scenarios
- Always write tests BEFORE implementation
- Game logic MUST be separated from Phaser rendering for testability
- Server integration tests in `server/src/__tests__/integration/`

## Code style

- TypeScript strict mode everywhere
- Pure functions for game logic (isometric math, pathfinding, validation)
- Phaser scenes only call into pure game-logic functions
- Server validates all client input

## Key patterns

- Isometric: grid coords (x, y) → screen coords via `gridToScreen()` in shared
- Depth sorting: `getDepth(pos)` returns render order
- Movement: WASD/arrows, `getMoveDelta()` + `applyMove()` in shared, with obstacle checking
- Multiplayer: Socket.IO, server broadcasts state changes, clients render
- Events: `player:join`, `player:leave`, `player:move`, `chat:send`, `chat:message`, `peer:id`
- Proximity: PeerJS WebRTC, audio/video auto-connect within 3 tiles, volume scales with distance
- Obstacles: desk positions in `OBSTACLES` Set, checked by `isWalkable()` before movement
