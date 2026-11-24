# Architecture

Détail complet et justifications : [`conception/3-architecture-technique.md`](conception/3-architecture-technique.md).
Ce fichier décrit **ce qui existe réellement dans le code**.

## Le monorepo

pnpm workspaces + Turborepo.

```
apps/web/           Le site (React + Vite)
apps/mobile/        L'app mobile (Expo + Expo Router), voir sprint-mobile.md
packages/common/    Code partagé web + mobile, SANS composant visuel (@afro/common)
packages/config/    TypeScript, ESLint, thème Tailwind partagés (@afro/config)
agents/             Cette documentation
```

`@afro/common` est **source-only** : pas d'étape de build, les apps importent directement le TypeScript.
Deux points d'entrée : `@afro/common` (tout sauf les mocks) et `@afro/common/mocks` (à ne jamais importer
dans du code de production, seulement dans `apps/web/src/mocks` et les tests).

## `packages/common/src`

| Dossier    | Rôle                                                                                       | À savoir                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `schemas/` | Schémas Zod : entités, formulaires (`…InputSchema`), vues renvoyées par l'API (`views.ts`) | **Source de vérité.** Un fichier par bloc du modèle                                                             |
| `types/`   | Types déduits des schémas (`z.infer`, `z.input` pour les formulaires)                      | Ne jamais écrire un type à la main s'il peut être déduit                                                        |
| `rules/`   | Règles métier en fonctions pures                                                           | Voir [`regles-metier.md`](regles-metier.md). Pas d'accès réseau, pas de `Date.now()` : la date est un paramètre |
| `api/`     | Interface `ApiClient` (toutes les opérations du MVP) + `createHttpApiClient`               | Chaque réponse est validée par Zod. Erreurs : `ApiError { status, code, message }`                              |
| `queries/` | Hooks TanStack Query + `queryKeys`                                                         | Un hook par opération, ajoutés lot par lot                                                                      |
| `mocks/`   | Seed, base en mémoire, handlers MSW                                                        | Voir ci-dessous                                                                                                 |
| `utils/`   | `formatPrice`, outils de dates (`toIsoDate`, `addDays`, `daysBetween`)                     |                                                                                                                 |

### Le chemin d'une donnée

```
Écran React → hook (queries/) → ApiClient (api/) → fetch /api/...
   → [aujourd'hui] handler MSW (mocks/handlers/) → mockDb + règles (rules/)
   → [lot 10]      Supabase (nouvelle implémentation de l'ApiClient, écrans inchangés)
```

### Les mocks

- `mocks/seed/` : le jeu de démo. `buildSeed(now)` construit toutes les tables avec des dates **relatives à `now`**
  (une réservation « dans 20 jours » le reste). Les champs dérivés (note moyenne, prix « à partir de », totaux,
  masquage) sont calculés avec les règles.
- `mocks/data.ts` : `mockDataSchema` (une table par entité) et le type `MockData`.
- `mocks/db.ts` : `createMockDb()` : `data`, `update(fn)` (modifie puis sauvegarde), `reset()`, `newId(prefix)`,
  `now()`, `enablePersistence(storage)`.
- `mocks/handlers/` : un fichier par ressource, chacun exporte `xxxHandlers(db)`. `createHandlers(db)` les assemble.
  `handlers/http.ts` : `apiError(status, code, message)` et `currentUser(db, request)`.
- `mocks/mappers.ts` : `toProviderCard`, `toPublicUser` (ce qu'on a le droit de montrer).
- `mocks/index.ts` exporte le singleton **`mockDb`** et **`handlers`** (branchés dessus).

Authentification mockée : le jeton est `demo:<userId>`, envoyé en `Authorization: Bearer …`
(option `getToken` de `createHttpApiClient`).

Dans le navigateur, `apps/web/src/mocks/browser.ts` active la persistance `localStorage`.
Dans les tests web, `apps/web/src/test/setup.ts` appelle `mockDb.reset()` après chaque test.

### Ajouter une opération (recette)

1. Schéma(s) dans `schemas/` (+ test si validation non triviale), type dans `types/`.
2. Signature dans `ApiClient` (déjà présente pour tout le MVP) et route dans `httpApiClient.ts` (déjà présente).
3. Handler dans `mocks/handlers/<ressource>.ts`, qui **utilise les règles** et renvoie `apiError(...)` en cas de refus.
4. Test du handler via `createHttpApiClient` (voir `api/httpApiClient.test.ts`).
5. Hook dans `queries/` + clé dans `queryKeys.ts`, invalidations après les mutations.
6. Écran dans `apps/web/src/features/<fonctionnalité>/` + test fonctionnel + parcours Playwright si c'est un parcours clé.

## `apps/web`

### Routes et espaces (lot 2)

| Espace      | Préfixe                                                                                                              | Garde                                                            | Gabarit                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------- |
| Public      | `/`, `/connexion`, `/deconnexion`, `/recherche`, `/categories/:slug`, `/prestataires/:slug`, `/devenir-prestataire`… | aucune                                                           | `PublicLayout`             |
| Client      | `/espace/…` (demandes, reservations, messages, avis, compte)                                                         | `<RequireAuth />`                                                | `ClientLayout` (onglets)   |
| Prestataire | `/pro/…` (tableau de bord, demandes, devis, messages, agenda, avis, profil, onboarding)                              | `<RequireAuth role="provider" />` → sinon `/devenir-prestataire` | `ProLayout` (menu latéral) |
| Admin       | `/admin/…` (prestataires, signalements, utilisateurs)                                                                | `<RequireAuth role="admin" />` → sinon « Accès refusé »          | `AdminLayout`              |

Toutes les adresses sont dans `src/app/routes.tsx`. Chaque page est une route `lazy` vers `src/features/<fonctionnalité>/pages/…`
(le helper `soon()` des pages « Bientôt disponible » a été retiré au lot 9 : toutes les pages du MVP existent).
Pages publiques de contenu (P7) : `/comment-ca-marche`, `/faq`, `/cgu`, `/mentions-legales`, `/confidentialite`
(`features/static/`, gabarit `StaticPage`).

### Session

`src/stores/session.ts` (Zustand + localStorage) : `user`, `token`, `lastSpace`, `signIn`, `signOut`.
`AppProviders` passe `getToken` à l'ApiClient. Pour se déconnecter, on navigue vers `/deconnexion`
(fermer la session depuis une page protégée déclencherait sa garde). Dans les tests :
`renderRoute(url, { as: 'user-aissatou' })` ouvre une session ; `setup.ts` la ferme après chaque test.

- `src/app/` : `App`, `AppProviders` (QueryClient + ApiClient), `routes.tsx`, layouts.
- `src/features/<fonctionnalité>/` : `components/`, `pages/`, et leurs tests à côté.
- `src/components/ui/` : composants shadcn/ui copiés dans le projet (modifiables).
- `src/test/` : `setup.ts`, `server.ts` (MSW Node), `renderRoute.tsx`.
- `e2e/` : Playwright (projets `desktop` et `mobile`).
- MSW actif si `VITE_USE_MOCKS=true` (`.env.development`, `.env.e2e`).

## `apps/mobile` (depuis le lot M1)

Plan complet : [`sprint-mobile.md`](sprint-mobile.md).

```
apps/mobile/
  app/                 Les écrans pour Expo Router : un fichier = une adresse
  app/(tabs)/          Les 5 onglets du mode client ; « (tabs) » ne compte pas dans l'adresse (Accueil = « / »)
  app/(auth)/          Les écrans de connexion (/bienvenue, /inscription, /verification, /connexion…)
  src/features/        Le code des écrans, par fonctionnalité (comme le web) ; app/ ne fait que les réexporter
  src/components/ui/   Composants de base (Button, Input, Card…), équivalents des composants shadcn du site
  src/components/brand/ Logo Wenzee (SVG)
  src/lib/cn.ts        cn(), formatRating(), initials()
  src/lib/api/         Le client API de l'app (celui de common) + mockFetch (handlers MSW sans réseau)
  src/lib/demoData.ts  Au démarrage : recharge la base de démo et la session depuis AsyncStorage
  src/lib/polyfills/   Ce qui manque à Hermes (URL, crypto.randomUUID, EventTarget… pour MSW)
  src/providers/       AppProviders : QueryClient (TanStack Query) + ApiClient
  src/features/splash/ Démarrage : useAppReady (polices + données), SplashGate, AnimatedSplash (Reanimated)
  src/features/home/   Accueil (bannière, catégories, « À la une »)
  src/features/providers/ ProviderCard (carte prestataire) et priceLabel
  src/components/QueryState.tsx Chargement → erreur (« Réessayer ») → contenu
  src/features/auth/   Connexion simulée : écrans, SignInRequired (garde), authFlowStore (où revenir), useFinishAuth
  src/features/navigation/ Barre d'onglets en verre rétractable (GlassTabBar, tabBarStore, useCollapseOnScroll), non-lus
  src/test/            Outils de test : demoApi (client branché sur une base de démo), faux Reanimated
  src/stores/          Session (Zustand + AsyncStorage)
  tailwind.config.js   NativeWind : preset partagé @afro/config/tailwind/preset.cjs (couleurs du site)
  global.css           Point d'entrée de NativeWind (importé dans app/_layout.tsx)
  app.json             Nom, icône, identifiants de l'app (Expo)
  metro.config.js      Le bundler d'Expo, réglé pour le monorepo et un seul React
  jest.config.js       Tests (jest-expo)
```

- Raccourci d'import `@/…` = `src/…` (dans `tsconfig.json` et `jest.config.js`).
- L'app importe `@afro/common` comme le site, avec les mêmes hooks de données (`useCategories`…).
- Données (lot M3) : écran → hook TanStack Query de `common` → `apiClient` (`createHttpApiClient`) →
  `mockFetch` → handlers MSW → `mockDb` (sauvegardée dans AsyncStorage). Pas de Service Worker sur téléphone :
  `mockFetch` appelle les handlers directement avec `getResponse` de MSW. Avec le vrai back-end, seul ce `fetch`
  disparaîtra.
- Attention : `src/app/` est interdit (Expo Router le prendrait pour le dossier des routes) ; les fournisseurs
  React vont dans `src/providers/`.
- Styles : NativeWind (`className`). Les couleurs viennent de `packages/config/tailwind/tokens.json` via
  `preset.cjs` ; le site lit les mêmes valeurs dans `theme.css` (un test vérifie qu'elles sont identiques).
- Connexion (lot M5) : formulaires React Hook Form + schémas Zod de `common` ; à la fin, `useFinishAuth` range la
  session (et vide le cache), ferme la pile d'écrans de connexion et revient à l'onglet retenu par `authFlowStore`.
  Les onglets protégés s'enveloppent dans `<SignInRequired>` (panneau « Connecte-toi » au lieu d'une redirection).
- Écran de travail `/catalogue` : tous les composants, pour relire le design sur téléphone.
