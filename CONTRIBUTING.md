# Contributing to Coco Working

Thanks for wanting to contribute! Here's how to get started.

## Quick Start

```bash
# Fork the repo then clone
git clone https://github.com/YOUR-USERNAME/cocoworking.git
cd cocoworking

# Install dependencies
pnpm install

# Start in dev mode (2 terminals)
pnpm --filter @cocoworking/server dev
pnpm --filter @cocoworking/client dev

# Open http://localhost:3000
```

## Before Coding

1. Check the [issues](https://github.com/cocolocow/cocoworking/issues) — those tagged `good first issue` are perfect to start with
2. Comment on the issue to claim it
3. Create a branch from `main`

## Conventions

- **TypeScript strict** everywhere
- **TDD** — write tests before code
- **Tests**: `pnpm -w run test` must pass before pushing
- **Business logic** in `packages/shared/` (pure functions, testable)
- **No over-engineering** — simplest solution first
- **English** for all code, comments, docs, and PRs

## Structure

```
packages/
  shared/   — Types, pure logic (isometric, movement, DJ, Pomodoro)
  server/   — Socket.IO, room management
  client/   — Phaser 3 + React, rendering, UI
```

## Running Tests

```bash
pnpm -w run test        # Everything
pnpm -w run test:unit   # Unit only
```

## Submitting a PR

1. One PR = one coherent change
2. Describe what your PR does and why
3. Tests pass
4. Type-check passes (`pnpm --filter @cocoworking/client lint`)

## Assets

Pixel art assets in `public/assets/tinyhouse/` are under commercial license. If you add new assets, make sure they are royalty-free or properly licensed.

## Questions?

Open an [issue](https://github.com/cocolocow/cocoworking/issues) or reach out to [@cocolocow](https://github.com/cocolocow).
