# Architecture

Détail complet et justifications : [`conception/3-architecture-technique.md`](conception/3-architecture-technique.md).
Ce fichier décrit **ce qui existe réellement dans le code**.

## Le monorepo

pnpm workspaces + Turborepo.

```
apps/web/           Le site (React + Vite)
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
