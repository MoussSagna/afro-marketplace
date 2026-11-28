# Conventions

## Langue

- **Code** (noms de variables, types, champs, routes) : **anglais**.
- **Commentaires, messages d'erreur, textes affichés, noms de tests, commits, PR, docs** : **français**.
- Les messages d'erreur des schémas et des règles sont prêts à être affichés et tutoient l'utilisateur
  (« Choisis la date de l'événement »).
- **App mobile, depuis M6b** : aucun texte affiché écrit en dur dans un écran. On ajoute la clé dans
  `packages/common/src/i18n/fr.ts` **et** `en.ts`, puis `t('section.cle')`. Un nouveau message d'erreur d'un schéma
  va aussi dans `fr.errors` (sinon il s'affiche en français). Le site n'est pas encore traduit.

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
  Reanimated est remplacé par notre faux (`src/test/reanimatedMock.tsx`) via `moduleNameMapper` : ne pas le
  re-mocker dans un test (`expo-router/testing-library` le casserait).
  Même règle que le web : unitaires et fonctionnels pour chaque écran. `render` est asynchrone : `await render(...)`.
- **Hermes** (le moteur JavaScript de l'app) n'a pas tout `Intl` : pas de `Intl.RelativeTimeFormat` (ni `ListFormat`,
  `Segmenter`…). Jest tourne sous Node, qui les a : les tests ne voient pas le problème, l'app plante au lancement.
  Dans `@afro/common`, n'utiliser que `Intl.DateTimeFormat` et `Intl.NumberFormat` ; jamais d'autre `Intl` créé en
  haut d'un fichier (il casse tout ce qui importe `@afro/common`). Exemple : `formatTimeAgo` (27/11/2026).
- **@gorhom/bottom-sheet** (panneaux du bas) : passer par `components/AppBottomSheet` ; sous Jest, un faux
  (`src/test/bottomSheetMock.tsx`) ouvre et ferme vraiment le panneau. Un composant rendu seul qui lit les zones sûres
  a besoin d'un `SafeAreaProvider` dans son test.
- Les tests sont à côté du fichier testé (`foo.ts` → `foo.test.ts`).
- La CI est plus lente que nos postes : `findBy…` attend jusqu'à 5 s (`configure` dans `apps/web/src/test/setup.ts`)
  et un test web peut durer 20 s (`testTimeout`). N'ajoute pas de `timeout` au cas par cas.
- Les pages `lazy` du routeur sont **préchargées avant les tests** de chaque fichier (`apps/web/src/test/preloadRoutes.ts`,
  appelé dans `setup.ts`) : sur la CI, compiler une page à la volée au moment d'une navigation dépassait parfois les
  5 s d'attente (le test voyait encore la page d'avant). Le vrai chargement à la demande est couvert par Playwright.
- Le seed a ses propres tests de cohérence (`mocks/seed/buildSeed.test.ts`) : si tu modifies le seed, ils doivent rester verts.

## Style

- Prettier + ESLint partagés (`packages/config`). Variables/paramètres non utilisés : préfixe `_`.
- TypeScript strict avec `noUncheckedIndexedAccess`.
- Composants UI : shadcn/ui d'abord, composants maison ensuite. Animations Motion en respectant `prefers-reduced-motion`.
- Web organisé **par fonctionnalité** (`features/search`, `features/quote-requests`…).

## Git et PR

### Branches (règle de Mouss, 26/11/2026)

- **`main` = la production** : c'est ce que Vercel met en ligne sur le site public. On n'y pousse jamais directement.
- **`dev` = la branche de développement** : tout le travail part de `dev`.
- Chaque lot ou sujet : une branche créée **depuis `dev`** (`git checkout -B <ma-branche> origin/dev`), et une PR
  **qui cible `dev`** (jamais `main`).
- **`dev` ne va dans `main` que quand Mouss le demande** (une PR `dev` → `main`, « mise en production »).
  Cette PR se fusionne avec **« Create a merge commit »**, jamais « Squash and merge » : un squash recrée
  les commits sous un autre identifiant, `main` et `dev` divergent et la PR suivante repart avec tout l'historique.
  Si ça arrive, on ramène `main` dans `dev` (PR `main` → `dev`, sans changement de contenu).
- Après la fusion d'une PR dans `dev`, la branche suivante repart de `origin/dev` à jour.
- La CI tourne sur chaque PR et sur chaque push dans `main` et `dev`.
- **Une branche fusionnée est supprimée** (règle de Mouss, 26/11/2026) : dès qu'une PR est fusionnée, sa branche
  disparaît du dépôt distant. Il ne reste en permanence que `main` et `dev`. Claude n'a pas le droit de supprimer
  une branche distante (GitHub refuse, erreur 403) : la suppression passe par l'option GitHub « Automatically delete
  head branches » (Settings → General) ou par Mouss (onglet Branches, corbeille). Côté agent, la PR suivante repart
  de `origin/dev` à jour, même si elle réutilise le même nom de branche.

- **Une PR par lot** (ou par sujet si le lot est gros), commits en français, au format `feat(common): …`, `fix(web): …`, `docs(agents): …`.
- La CI doit être verte : format, lint, types, tests, build, Playwright.
- Chaque PR met à jour `agents/avancement.md` (et les autres fiches si besoin).
- Une décision reportée ou une question qui pourrait avoir un impact plus tard va dans `agents/questions-ouvertes.md` (choix actuel, impact, échéance), à mettre à jour dans la même PR.
- On ne fusionne pas soi-même : Mouss relit et fusionne.

## Design (tokens Wenzee)

- N'utilise que les couleurs du thème : `primary` (terre intense, actions et liens), `foreground`, `muted`/`muted-foreground` (texte secondaire #6B4A36), `secondary` (sable), `accent` (soleil, **fond uniquement**, avec `accent-foreground`), `ochre` (étoiles, filets, focus, **jamais en texte**), `clay` (décor seulement), `success`/`warning`/`destructive` et leurs variantes `-muted`, `sidebar-*` pour le menu pro.
- Survols et éléments actifs de menu : `bg-muted`, pas `bg-accent` (le soleil est réservé aux pastilles).
- Tout le site est en **Nunito** (la police du logo, choix de Mouss du 27/11/2026). Titres h1–h3 avec `font-display`
  (appliqué par défaut, aussi en Nunito) : la hiérarchie se fait par la taille et la graisse, pas par une 2e police.
- Rayons : `rounded-md` (10 px) boutons et champs, `rounded-xl` (16 px) cartes, `rounded-full` pastilles.
- Logo : toujours le composant `Logo` (`components/Logo.tsx`), jamais un nom écrit à la main ; sur photo ou fond sombre, `variant="light"`.
- En-tête et pied de page : une seule navbar (`components/layout/Navbar.tsx`) et un seul pied de page
  (`components/layout/SiteFooter.tsx`) pour tout le site ; ne pas en recréer pour une page. Les SVG de la marque (versions claire, noire, blanche, icône) sont dans `/mnt/project-files/marque-wenzee/`.
- Piège du `Button` shadcn : avec une icône dedans, `has-[>svg]:px-3` écrase les marges passées en `className`.
  Pour élargir un bouton avec icône, ajouter aussi `has-[>svg]:px-…`.
- Piège des marges responsives : un raccourci `lg:p-8` réécrit les 4 marges et efface un `md:pl-…` plus spécifique ;
  préférer des côtés explicites, ou une plage (`lg:max-[1399px]:pl-8`). Les points de rupture arbitraires
  (`min-[1400px]:`) ne passent pas toujours après `sm:`/`lg:` dans la feuille générée.
- **Mobile** : mêmes noms de classes que le site grâce au preset (`bg-cta`, `text-muted-foreground`…). Polices (toutes en Nunito) :
  `font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`, `font-display`. Composants de base dans
  `apps/mobile/src/components/ui/` ; on n'ajoute pas de couleur en dur (sauf les icônes lucide, qui prennent un code hexa).
- Images de la maquette (catégories, états vides, bannière) : `/mnt/project-files/maquette/assets/`.

## Validation visuelle (tout développement visuel)

Demandée par Mouss le 25/11/2026, pour le hero puis pour **tous** les écrans : **coder → capturer → comparer → corriger →
recapturer**.

1. Analyser la maquette avant de coder (dimensions, positions, cadrages) ; elle est la référence, sans ajout personnel.
2. Capturer le rendu réel avec Playwright **à la résolution exacte de la maquette** (et en tablette / mobile).
3. Lister les écarts par priorité ; chaque correction répond à un écart identifié.
4. **3 cycles maximum** (première intégration comprise) ; les écarts restants sont documentés, pas cachés.
5. Documenter dans `docs/<sujet>-validation.md` (mesures, écarts, corrections), sans y insérer les images.
   Exemple : [`docs/hero-integration-validation.md`](../docs/hero-integration-validation.md).
6. **Captures d'écran : jamais commitées** (règle de Mouss, 25/11/2026). Elles servent pendant le travail
   (par ex. dans `docs/screenshots/<sujet>/`) et pour les montrer à Mouss, puis **elles sont supprimées à la fin,
   avant chaque PR**. Avant de commiter, vérifier : `git status --short` ne doit lister aucun `.png`, `.jpg` ou `.webp`
   de capture, et `docs/screenshots/` ne doit plus exister.
