# Contribuer a Coco Working

Merci de vouloir contribuer ! Voici comment participer.

## Demarrage rapide

```bash
# Fork le repo puis clone
git clone https://github.com/TON-USERNAME/cocoworking.git
cd cocoworking

# Installe les dependances
pnpm install

# Lance en dev (2 terminaux)
pnpm --filter @cocoworking/server dev
pnpm --filter @cocoworking/client dev

# Ouvre http://localhost:3000
```

## Avant de coder

1. Regarde les [issues](https://github.com/cocolocow/cocoworking/issues) — celles taguees `good first issue` sont parfaites pour commencer
2. Commente l'issue pour dire que tu la prends
3. Cree une branche depuis `main`

## Conventions

- **TypeScript strict** partout
- **TDD** — ecris les tests avant le code
- **Tests** : `pnpm -w run test` doit passer avant de push
- **Logique metier** dans `packages/shared/` (fonctions pures, testables)
- **Pas de over-engineering** — la solution la plus simple d'abord

## Structure

```
packages/
  shared/   — Types, logique pure (isometrique, mouvement, DJ, Pomodoro)
  server/   — Socket.IO, gestion des rooms
  client/   — Phaser 3 + React, rendu, UI
```

## Lancer les tests

```bash
pnpm -w run test        # Tout
pnpm -w run test:unit   # Unit seulement
```

## Soumettre une PR

1. Une PR = un changement coherent
2. Decris ce que ta PR fait et pourquoi
3. Les tests passent
4. Le type-check passe (`pnpm --filter @cocoworking/client lint`)

## Assets

Les assets pixel art (dossier `public/assets/tinyhouse/`) sont sous licence commerciale. Si tu ajoutes de nouveaux assets, assure-toi qu'ils sont libres de droits ou que tu as la licence.

## Questions ?

Ouvre une [issue](https://github.com/cocolocow/cocoworking/issues) ou contacte [@cocolocow](https://github.com/cocolocow).
