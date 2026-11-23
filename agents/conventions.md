# Conventions

## Langue

- **Code** (noms de variables, types, champs, routes) : **anglais**.
- **Commentaires, messages d'erreur, textes affichés, noms de tests, commits, PR, docs** : **français**.
- Les messages d'erreur des schémas et des règles sont prêts à être affichés et tutoient l'utilisateur
  (« Choisis la date de l'événement »).

## Données

- **Montants en centimes d'euro, entiers** (`90000` = 900 €). Affichage avec `formatPrice`.
- **Jour** = chaîne ISO `AAAA-MM-JJ` ; **date-heure** = ISO complet en UTC. Calculs avec `utils/dates.ts` (en UTC).
- Les règles ne lisent jamais l'horloge : on leur passe `today` ou `now`. La base mockée a `db.now()`.
- Les identifiants du seed sont lisibles (`prov-saveurs-de-dakar`, `user-aissatou`, `qr-3`).
- Les types sont **déduits** des schémas Zod, jamais dupliqués.
- Les schémas d'entité n'ont pas de `.refine` (pour pouvoir utiliser `.omit`, `.extend`) ;
  les vérifications croisées vont dans les schémas de formulaire ou dans `rules/`.
- Une règle qui autorise/refuse renvoie un `RuleResult` : `{ allowed: true }` ou
  `{ allowed: false, reason: 'code_stable', message: 'Phrase à afficher' }`.

## Tests (exigés par Mouss)

- **Unitaires** (Vitest) pour chaque règle et chaque schéma de formulaire non trivial, avec les cas limites.
- **Fonctionnels** (Vitest + Testing Library + MSW) pour chaque écran : chargement, vide, erreur, interaction.
- **Playwright** pour les parcours clés (les 8 parcours de l'étape 3), en `desktop` et `mobile`.
- **Mobile** : Jest + jest-expo + Testing Library React Native (Vitest ne fait pas tourner React Native).
  Même règle que le web : unitaires et fonctionnels pour chaque écran. `render` est asynchrone : `await render(...)`.
- Les tests sont à côté du fichier testé (`foo.ts` → `foo.test.ts`).
- La CI est plus lente que nos postes : `findBy…` attend jusqu'à 5 s (`configure` dans `apps/web/src/test/setup.ts`)
  et un test web peut durer 20 s (`testTimeout`). N'ajoute pas de `timeout` au cas par cas.
- Le seed a ses propres tests de cohérence (`mocks/seed/buildSeed.test.ts`) : si tu modifies le seed, ils doivent rester verts.

## Style

- Prettier + ESLint partagés (`packages/config`). Variables/paramètres non utilisés : préfixe `_`.
- TypeScript strict avec `noUncheckedIndexedAccess`.
- Composants UI : shadcn/ui d'abord, composants maison ensuite. Animations Motion en respectant `prefers-reduced-motion`.
- Web organisé **par fonctionnalité** (`features/search`, `features/quote-requests`…).

## Git et PR

- **Une PR par lot** (ou par sujet si le lot est gros), commits en français, au format `feat(common): …`, `fix(web): …`, `docs(agents): …`.
- La CI doit être verte : format, lint, types, tests, build, Playwright.
- Chaque PR met à jour `agents/avancement.md` (et les autres fiches si besoin).
- Une décision reportée ou une question qui pourrait avoir un impact plus tard va dans `agents/questions-ouvertes.md` (choix actuel, impact, échéance), à mettre à jour dans la même PR.
- On ne fusionne pas soi-même : Mouss relit et fusionne.

## Design (tokens Wenzee)

- N'utilise que les couleurs du thème : `primary` (terre intense, actions et liens), `foreground`, `muted`/`muted-foreground` (texte secondaire #6B4A36), `secondary` (sable), `accent` (soleil, **fond uniquement**, avec `accent-foreground`), `ochre` (étoiles, filets, focus, **jamais en texte**), `clay` (décor seulement), `success`/`warning`/`destructive` et leurs variantes `-muted`, `sidebar-*` pour le menu pro.
- Survols et éléments actifs de menu : `bg-muted`, pas `bg-accent` (le soleil est réservé aux pastilles).
- Titres h1–h3 en Playfair Display (`font-display`, appliqué par défaut), le reste en Inter.
- Rayons : `rounded-md` (10 px) boutons et champs, `rounded-xl` (16 px) cartes, `rounded-full` pastilles.
- Logo : toujours le composant `Logo` (`components/Logo.tsx`), jamais un nom écrit à la main. Les SVG de la marque (versions claire, noire, blanche, icône) sont dans `/mnt/project-files/marque-wenzee/`.
- **Mobile** : mêmes noms de classes que le site grâce au preset (`bg-cta`, `text-muted-foreground`…). Polices :
  `font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`, `font-display`. Composants de base dans
  `apps/mobile/src/components/ui/` ; on n'ajoute pas de couleur en dur (sauf les icônes lucide, qui prennent un code hexa).
- Images de la maquette (catégories, états vides, bannière) : `/mnt/project-files/maquette/assets/`.
