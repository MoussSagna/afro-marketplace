# afro-marketplace

**Wenzee** : marketplace de prestataires afro pour les événements (traiteurs, danse, shows, speakers, DJ…), en Île-de-France d'abord.

## Démarrer

Prérequis : Node 22 (voir `.nvmrc`) et pnpm 10 (`corepack enable` suffit).

```bash
pnpm install
pnpm dev          # http://localhost:5173, avec les données mockées
```

## Commandes utiles

| Commande                           | Ce qu'elle fait                                                  |
| ---------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                         | Lance le site web en développement                               |
| `pnpm check`                       | Lint + vérification des types + tests unitaires et fonctionnels  |
| `pnpm test`                        | Tests Vitest de tous les paquets                                 |
| `pnpm test:e2e`                    | Tests Playwright (construit le site puis le teste dans Chromium) |
| `pnpm build`                       | Construit le site pour la production                             |
| `pnpm format`                      | Met en forme tout le code avec Prettier                          |
| `pnpm --filter @afro/mobile start` | Lance l'app mobile (QR code à scanner avec Expo Go)              |

Dans un seul paquet : `pnpm --filter @afro/web test:watch`.

Première fois avec Playwright sur ta machine : `pnpm --filter @afro/web exec playwright install chromium`.

## Organisation

```
apps/
  mobile/              App mobile : Expo, Expo Router (NativeWind et Moti arrivent avec les lots M2 et M4)
  web/                 Site web : React, Vite, Tailwind, shadcn/ui, Motion, React Router, TanStack Query
    src/app/           Démarrage : providers, routes, layouts
    src/features/      Un dossier par fonctionnalité (search, quote-requests, messaging…)
    src/components/ui/ Composants shadcn/ui (copiés dans le projet, modifiables)
    e2e/               Tests Playwright
packages/
  common/              Code partagé web + mobile (sans aucun composant visuel)
    src/schemas/       Schémas Zod (une entité = un fichier)
    src/types/         Types TypeScript déduits des schémas
    src/rules/         Règles métier en fonctions pures
    src/api/           Interface ApiClient + implémentation HTTP
    src/queries/       Hooks TanStack Query
    src/mocks/         Données de test et handlers MSW
    src/utils/         Formatage (prix…)
  config/              Réglages partagés : TypeScript, ESLint, thème Tailwind
```

L'app mobile (`apps/mobile`) réutilise `packages/common`. Plan : `agents/sprint-mobile.md`.

## Données mockées

Il n'y a pas encore de back-end. Quand `VITE_USE_MOCKS=true` (déjà le cas en développement, voir `apps/web/.env.development`), MSW intercepte les appels à `/api` et répond avec les données de `packages/common/src/mocks`. Les écrans ne savent pas que c'est faux : le jour du vrai back-end, on change l'implémentation de l'`ApiClient`, pas les écrans.

## Ajouter un composant shadcn/ui

```bash
cd apps/web
pnpm dlx shadcn@latest add dialog
```

Le composant est copié dans `src/components/ui/`. Les couleurs viennent des variables de `src/index.css`, elles-mêmes reliées au thème de la marque dans `packages/config/tailwind/theme.css`.
