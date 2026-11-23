# Commandes et environnement

## Commandes

| Commande                                   | Effet                                                        |
| ------------------------------------------ | ------------------------------------------------------------ |
| `pnpm install`                             | Installe tout (Node ≥ 22.13, pnpm 10 via `corepack enable`)  |
| `pnpm dev`                                 | Site web sur http://localhost:5173, avec les mocks           |
| `pnpm check`                               | Lint + types + tests Vitest de tous les paquets              |
| `pnpm turbo run lint typecheck test build` | Ce que lance la CI (avec `pnpm format:check`)                |
| `pnpm test:e2e`                            | Playwright (build + Chromium), projets `desktop` et `mobile` |
| `pnpm format` / `pnpm format:check`        | Prettier                                                     |
| `pnpm --filter @afro/common test`          | Tests d'un seul paquet                                       |
| `pnpm --filter @afro/web test:watch`       | Tests en continu                                             |
| `pnpm --filter @afro/mobile start`         | App mobile : affiche un QR code à scanner avec Expo Go       |
| `pnpm --filter @afro/mobile test`          | Tests de l'app mobile (jest-expo)                            |

Avant de pousser : `pnpm format && pnpm turbo run lint typecheck test build`, puis `pnpm test:e2e` si un écran a changé.

## Versions (choisies au lot 0)

React 19, React Router 8, Vite 8, Tailwind v4 (thème en CSS dans `packages/config/tailwind/theme.css`),
TypeScript 6.0 (**pas 7** : pas encore supporté par typescript-eslint), Zod 4, MSW 2, Vitest 5,
Playwright **épinglé en 1.63.0**.

Mobile (lot M1) : Expo SDK 58 (React Native 0.88, **React 19.3.0 imposé**, donc forcé pour tout le dépôt
dans `pnpm-workspace.yaml`), Expo Router 58, Jest 30 + jest-expo, Testing Library React Native 14.

## Après un `git pull`

Toujours relancer `pnpm install` : un lot peut ajouter une dépendance (ex. `zod` dans `apps/web` au lot 4,
`@axe-core/playwright` au lot 9). Si une erreur « Cannot find module » persiste (lien manquant dans
`node_modules`), `pnpm install --force` recrée tous les liens. Le dépôt est sain : une installation propre
(`pnpm install --frozen-lockfile`) crée bien `apps/web/node_modules/zod` (vérifié le 22/11/2026, QA de Mouss).

## Pièges connus (environnement cloud des agents)

- Le registre `ui.shadcn.com` est bloqué depuis le bac à sable : les composants shadcn/ui y sont écrits à la main
  (même code que le registre) dans `apps/web/src/components/ui/`. En local, `pnpm dlx shadcn@latest add …` marche.
- Chromium est préinstallé : ne pas lancer `playwright install` (la version 1.63.0 correspond au navigateur fourni).
  Passer `--trace off` aux lancements de Playwright.
- Audit d'accessibilité seul : `pnpm --filter @afro/web exec playwright test e2e/a11y.spec.ts --trace off`
  (axe-core attend la fin des fondus d'apparition avant de mesurer les contrastes).
- `vite build` génère aussi `dist/sitemap.xml` et `dist/robots.txt` ; `SITE_URL=https://… pnpm build` pour
  forcer l'adresse du site.
- Zod 4 : `.omit/.pick/.extend` sont interdits sur un schéma qui a des `.refine` → garder les entités sans refine.
- Mobile : `render` (Testing Library React Native 14) et `renderRouter` (Expo Router) sont **asynchrones** :
  toujours `await render(...)`, sinon « `render` function has not been called ».
- Mobile : un paquet de `node_modules` écrit en ESM fait planter Jest (« Must use import to load ES Module ») ?
  Ajoute son nom à `transformIgnorePatterns` dans `apps/mobile/jest.config.js` (ex. `standard-navigation`).
- Mobile : vérifier que Metro assemble bien l'app sans téléphone :
  `cd apps/mobile && CI=1 pnpm exec expo export --platform ios --output-dir /tmp/expo-out`.
- Mobile : pour tester sur ton téléphone, il faut être sur le même réseau Wi-Fi que l'ordinateur
  (sinon `pnpm --filter @afro/mobile start -- --tunnel`).
