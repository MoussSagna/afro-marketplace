# Avancement

Dernière mise à jour : 24/11/2026 (lot M5 : connexion et inscription simulées).

## Lots

| Lot     | Sujet                                                                               | État        | PR  |
| ------- | ----------------------------------------------------------------------------------- | ----------- | --- |
| 0       | Socle du monorepo + CI                                                              | ✅ fusionné | #1  |
| 1       | Cœur partagé : schémas, règles, base mockée, dossier `agents/`                      | ✅ fusionné | #2  |
| 2       | Design system, layouts, connexion de démo                                           | ✅ fusionné | #3  |
| 3       | Découvrir : accueil, recherche, catégories, profil                                  | ✅ fusionné | #4  |
| 4       | Demander un devis + messagerie                                                      | ✅ fusionné | #5  |
| 5       | Devis et réservation → **jalon A** (démo cliquable, s'arrêter pour que Mouss teste) | ✅ fusionné | #6  |
| 6       | Avis : laisser un avis (C6), avis reçus (S8)                                        | ✅ fusionné | #7  |
| 7       | Devenir prestataire (P6), onboarding en étapes (S1), modifier mon profil (S7)       | ✅ fusionné | #8  |
| 8       | Admin minimal : profils à valider, signalements, utilisateurs                       | ✅ fusionné | #9  |
| 9       | Mon compte (C8), pages de contenu (P7), SEO, accessibilité → **jalon B**            | ✅ fusionné | #10 |
| 10 – 11 | Supabase, emails + bêta → jalon C                                                   |             |     |

## Application mobile (en préparation)

Ordre voulu par Mouss : site mocké (fait) → **app mobile** → back-end Supabase en dernier.

- Maquette mobile validée « pour le moment » le 23/11/2026 : `/mnt/project-files/maquette-mobile/`.
- Plan en 7 sprints et 16 petits lots (M0 → M16), une PR par lot : [`sprint-mobile.md`](sprint-mobile.md).
  Plan fusionné (#15). « Go M1 » donné par Mouss le 23/11/2026.

| Lot | Sujet                                  | État                                                             |
| --- | -------------------------------------- | ---------------------------------------------------------------- |
| M0  | Sprint planning                        | ✅ fusionné #15 (+ #16)                                          |
| M1  | Squelette Expo + monorepo + tests + CI | ✅ fusionné #17 (testé par Mouss sur son téléphone avec Expo Go) |
| M2  | Thème NativeWind + composants de base  | ✅ fusionné #18                                                  |
| M3  | Données mockées sur téléphone          | ✅ fusionné #19                                                  |
| M4  | Onglets + splash animé + icône         | ✅ fusionné #20                                                  |
| M4b | Barre d'onglets en verre rétractable   | ✅ fusionné #21                                                  |
| M5  | Connexion et inscription simulées      | 🔍 PR ouverte                                                    |

## Ce que contient le lot M5

- **Côté `common`** (servira aussi au site et au vrai back-end) : schémas Zod `schemas/auth.ts` (email nettoyé,
  règles du mot de passe `passwordRules` affichées et cochées en direct, `passwordStrength` pour la jauge, code à
  6 chiffres), 6 méthodes de l'`ApiClient` (`signUp`, `verifyOtp`, `resendOtp`, `signIn`, `forgotPassword`,
  `resetPassword`) et leurs hooks (`useSignUp`…), routes **simulées** `POST /api/auth/…` dans
  `mocks/handlers/auth.ts`. Code de démo **toujours `123456`** (`DEMO_OTP_CODE`), aucun email envoyé.
- La base de démo a deux tables de plus : `credentials` (email + mot de passe, en clair car c'est une démo) et
  `pendingSignUps` (inscriptions en attente du code). Les comptes de démo ont le mot de passe **`Wenzee2026`**
  (`DEMO_PASSWORD`). Une sauvegarde d'avant M5 est complétée toute seule au démarrage.
- **Écrans** (`src/features/auth/`, adresses dans `app/(auth)/`) : Bienvenue (`/bienvenue`), Inscription
  (`/inscription`, jauge de force + règles en direct + case des conditions), Code (`/verification`, 6 cases sur un
  seul champ invisible, vérifié dès le 6e chiffre, renvoi après 30 s, « Modifier l'email »), Connexion
  (`/connexion`, œil pour afficher le mot de passe), Mot de passe oublié, Nouveau mot de passe (règles + confirmation),
  Compte vérifié (« C'est bon ! »), Comptes de démo (`/comptes-demo`, P8). Google et Apple : « Bientôt disponible ».
- Formulaires avec **React Hook Form + zodResolver**, comme sur le site (`FormInput` relie un champ au formulaire).
  Les erreurs du serveur s'affichent sous le bon champ (email déjà pris) ou en haut du formulaire (mauvais mot de
  passe).
- **Gardes** : Demandes, Messages et Compte montrent un panneau « Connecte-toi » (`SignInRequired`) quand personne
  n'est connecté. Le bouton retient l'onglet (`authFlowStore`, adresse interne seulement) et, à la fin du parcours,
  `useFinishAuth` ferme les écrans de connexion et y revient. Compte connecté : nom, email et « Se déconnecter »
  (le reste au lot M12).
- **Barre d'onglets : icônes seules** (demande de Mouss du 24/11, ajoutée à cette PR) : plus de texte sous les
  icônes, les noms restent lus par VoiceOver / TalkBack. Maquette section 6 mise à jour.
- Tests : 336 tests `common` (schémas, handlers, sauvegarde ancienne), 112 tests mobiles dont `auth.test.tsx` :
  parcours complet Demandes → inscription → mauvais code → bon code → compte vérifié → retour aux Demandes, erreurs
  sous les champs, email déjà pris, renvoi du code, mauvais mot de passe, Google/Apple, comptes de démo, mot de passe
  oublié jusqu'à la connexion avec le nouveau, déconnexion.

## Ce que contient le lot M4 bis

- **Barre d'onglets en verre** (`src/features/navigation/GlassTabBar.tsx`, branchée par `tabBar` dans
  `ClientTabsLayout`) : pilule flottante translucide (flou `expo-blur` + voile clair + reflet), onglet actif en
  pastille claire, pastille de non-lus. Maquette section 6, **validée par Mouss le 24/11/2026**.
- **Rétractable** : on fait défiler vers le bas → elle se rétracte en un rond (onglet actif + pastille) ; on remonte,
  on touche le rond ou on change d'onglet → elle revient. État partagé dans un store Zustand (`tabBarStore.ts`) ;
  chaque écran qui défile branche `useCollapseOnScroll()` sur son `onScroll` (règle testable : `scrollDecision`).
  « Réduire les animations » : changement d'état sans mouvement (`src/lib/useReduceMotion.ts`).
- Fait avec `Animated` de React Native (pas Reanimated) : voir le piège dans `commandes.md`.
- Flou réel sur iPhone ; sur Android, voile translucide sans flou (le flou Android d'`expo-blur` demande d'envelopper
  tout l'écran, on verra au besoin).
- **Accueil provisoire** : il affiche maintenant les données de démo (catégories, prestataires à la une, ancien
  écran `/donnees` supprimé) pour avoir de quoi défiler. Les écrans laissent `TAB_BAR_SPACE` en bas.
- Accessibilité : onglets en rôle `tab` avec état « sélectionné », rond annoncé « Afficher les onglets, Accueil
  actif », onglets masqués aux lecteurs d'écran quand la barre est rétractée.
- Tests : 97 tests mobiles (`ClientTabsLayout.test.tsx` : rétraction au défilement, retour en remontant ou au
  toucher ; `useCollapseOnScroll.test.ts`).

## Ce que contient le lot M4

- **Onglets du mode client** (`app/(tabs)/`, `src/features/navigation/ClientTabsLayout.tsx`) : Accueil (l'écran de
  bienvenue provisoire, l'accueil complet arrive en M6), Recherche (M7), Demandes (M10), Messages (M10), Compte (M12).
  Les onglets vides affichent « Bientôt disponible » et leur lot (`ComingSoonScreen`). Icônes lucide.
- **Pastille de non-lus** sur Messages (`useClientUnreadCount`) : même requête et même cache que `useUnreadCount` de
  `common`, mais seulement si quelqu'un est connecté. VoiceOver lit « Messages, 2 non lus ».
- **Splash** : écran natif statique (`expo-splash-screen`, fond terre + symbole, réglé dans `app.json`) tant que
  polices et données chargent (`useAppReady`), puis le **splash animé** de la maquette (`AnimatedSplash`, 3,2 s) par-
  dessus l'app déjà dessinée (`SplashGate`). Fait avec **Reanimated** directement (pas Moti : Moti n'est pas garanti
  avec Reanimated 4, et une seule horloge `t` suffit pour rejouer les étapes des @keyframes de la maquette).
  « Réduire les animations » : logo complet sans mouvement, 0,9 s.
- **Icône de l'app** : `assets/images/icon.png` (1024 px, carré plein, iOS arrondit lui-même),
  `adaptive-icon.png` (Android, symbole seul dans la zone sûre) et `splash-icon.png`, exportés de
  `/mnt/project-files/marque-wenzee/wenzee-app-icon.svg`. Visibles seulement dans un vrai build (lot M16) :
  Expo Go garde sa propre icône et son propre écran de démarrage.
- **Demande de Mouss du 24/11** : barre d'onglets flottante en **verre** (façon iPhone) qui se **rétracte en un rond**
  au défilement → faite au lot M4 bis.
- Tests : 90 tests mobiles. Nouveaux : `ClientTabsLayout.test.tsx` (passer d'un onglet à l'autre, pastille),
  `SplashGate.test.tsx` (natif gardé pendant le chargement, splash animé puis retiré, version courte si animations
  réduites). Outils de test partagés : `src/test/demoApi.tsx`, faux Reanimated `src/test/reanimatedMock.tsx`.

## Ce que contient le lot M3

- **Les mocks tournent dans l'app, sans serveur ni réseau** : le client API est le même que sur le site
  (`createHttpApiClient`), seul son `fetch` change. `src/lib/api/mockFetch.ts` construit une `Request` et la donne
  aux handlers MSW de `common` avec `getResponse` (pas de Service Worker sur téléphone). Route inconnue : 404 au
  format de l'API. Le jour du back-end, on retire ce `fetch` et c'est tout.
- **Base de démo sauvegardée** : `prepareDemoData()` (`src/lib/demoData.ts`), lancée au démarrage pendant le
  chargement des polices, recharge la base depuis AsyncStorage. AsyncStorage est asynchrone alors que la base de
  `common` attend un stockage synchrone (le localStorage) : `src/lib/storage/preloadedStorage.ts` lit la clé une fois
  au démarrage, puis répond depuis une copie en mémoire et écrit dans AsyncStorage à chaque modification.
- **Session** : store Zustand gardé dans AsyncStorage (`src/stores/session.ts`, rechargé au démarrage). Les écrans
  de connexion sont arrivés au lot M5.
- **TanStack Query** : `src/providers/AppProviders.tsx` (QueryClient + ApiClient), autour de toute l'app dans
  `app/_layout.tsx`. Les écrans utilisent les hooks de `common` (`useCategories`, `useFeaturedProviders`…).
- **Photos** : composant `Photo` (`expo-image`, cache mémoire + disque, fondu) pour les photos `picsum.photos`.
- **Compléments pour Hermes** (`src/lib/polyfills/`) : `URL` complète (`react-native-url-polyfill`),
  `crypto.randomUUID` (`expo-crypto`) et des versions minimales d'`EventTarget`, `Event`, `MessageEvent`,
  `CloseEvent`, `BroadcastChannel`. MSW y fait référence dès son chargement (partie WebSocket) : sans elles, l'app
  planterait au démarrage. Vérifié en chargeant MSW dans Node privé de ces API.
- **Écran de travail `/donnees`** (bouton « Voir les données de démo ») : catégories et prestataires à la une,
  avec les états chargement / erreur (« Réessayer ») / résultat. Remplacé par l'accueil au lot M6.
- `BackHeader` (bouton Retour + titre) partagé par les écrans de travail.
- Tests : 84 tests mobiles. Nouveaux : `mockFetch.test.ts` (catégories, jeton, erreurs, POST, 404),
  `preloadedStorage.test.ts`, `demoData.test.ts` (rechargement et sauvegarde de la base et de la session),
  `session.test.ts`, `webEvents.test.ts`, `DemoDataScreen.test.tsx` (chargement → résultat, erreur → réessayer).
- Limite : la persistance ne se « voit » pas encore à l'écran (rien ne modifie la base avant M9) ; elle est
  couverte par les tests.

## Ce que contient le lot M2

- **NativeWind 4** (Tailwind 3 pour React Native) : `tailwind.config.js`, `global.css`, Babel et Metro branchés.
  On écrit `className="bg-primary rounded-xl"` comme sur le site.
- **Preset partagé** `packages/config/tailwind/preset.cjs`, construit depuis `tokens.json` : mêmes noms de couleurs
  que le site (`bg-cta`, `text-muted-foreground`, `bg-success-muted`…), rayons, tailles de texte, polices.
  Le test `src/theme/preset.test.ts` compare chaque couleur à `theme.css` du site : impossible de les désynchroniser.
- **Polices** Inter et Playfair Display (`@expo-google-fonts`), chargées dans `app/_layout.tsx`. Sur téléphone, chaque
  graisse est une police : `font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`, `font-display`.
- **Composants** (`src/components/ui/`, variantes avec `cva` comme shadcn) : `Text`, `Heading` + `Accent`, `Button`
  (cta, primary, secondary, outline, ghost, destructive ; `loading`, `disabled`), `Input` (libellé, aide, erreur),
  `Card`, `Badge`, `Chip`, `Avatar`, `Rating`, `EmptyState`. **Logo Wenzee** (`src/components/brand/Logo.tsx`,
  3 variantes, SVG recopiés de `/mnt/project-files/marque-wenzee/` dans `svgs.ts`). Icônes : `lucide-react-native`.
- **Écran Catalogue** (`/catalogue`, bouton « Voir les composants » de l'écran de bienvenue) : tous les composants
  pour relire le design sur un vrai téléphone. L'écran de bienvenue utilise maintenant le thème et le logo.
- Accessibilité : rôles et libellés pour VoiceOver/TalkBack (bouton, titre, image, état choisi/désactivé/occupé),
  erreurs de champ annoncées, cibles tactiles de 44 px minimum.
- Tests : 61 tests mobiles (`cn.test.ts`, `preset.test.ts`, `ui.test.tsx`, `CatalogueScreen.test.tsx`,
  `WelcomeScreen.test.tsx`). Limite : Jest ne calcule pas les styles NativeWind, on teste donc les classes des
  variantes et le comportement ; le rendu se vérifie à l'œil dans le Catalogue.

## Ce que contient le lot M1

- `apps/mobile` (`@afro/mobile`) : Expo SDK 58, Expo Router (`app/_layout.tsx`, `app/index.tsx`), TypeScript strict
  (config `react.json` partagée), ESLint partagé, nom « Wenzee » et identifiant `app.wenzee.mobile` dans `app.json`.
- Écran de bienvenue provisoire (`src/features/welcome/WelcomeScreen.tsx`) : il affiche un prix formaté par
  `@afro/common` pour prouver que le code partagé est bien branché. Couleurs provisoires dans `src/theme.ts`
  (remplacées par NativeWind au lot M2).
- **Un seul React** dans le dépôt : Expo 58 exige React 19.3.0 exactement. `pnpm-workspace.yaml` force
  `react` et `react-dom` en 19.3.0 (`overrides`) : le site passe de 19.3.1 à 19.3.0 (correctif mineur, tous les
  tests restent verts). En plus, `metro.config.js` résout toujours `react`, `react-native` et
  `@tanstack/react-query` depuis `apps/mobile`. Vérifié sur le bundle iOS : une seule copie de chacun.
- Tests : jest-expo + Testing Library React Native (`jest.config.js`, `jest.setup.ts`) ;
  `WelcomeScreen.test.tsx` (titre, prix formaté par `common`, route « / » avec `renderRouter`).
- La CI lance déjà `lint`, `typecheck` et `test` de tous les paquets : le mobile y est inclus sans changement.

## Changement de marque : Wenzee (23/11/2026)

Mouss a choisi le nom **Wenzee** (fin du nom provisoire « Teranga ») et le logo **piste 3 « Le lien »** : deux rubans
imbriqués qui forment un W, un losange au-dessus. Les SVG sont dans `/mnt/project-files/marque-wenzee/`. Les couleurs
du thème ne changent pas. Mouss veut le changement **étape par étape**, une petite PR à la fois :

| Étape | Contenu                                                                             | État   |
| ----- | ----------------------------------------------------------------------------------- | ------ |
| 1     | Le nom : textes, titres des pages, SEO, emails provisoires (`wenzee.example`), docs | ✅ #12 |
| 2     | Le logo : en-tête, pied de page, favicon ; suppression de `teranga-icon.svg`        | ✅ #13 |

Le préfixe des paquets `@afro/…` ne bouge pas pour l'instant (voir `questions-ouvertes.md`).

Étape 2 : composant `Logo` (`apps/web/src/components/Logo.tsx`, image `public/wenzee-logo.svg`) dans l'en-tête
(lien « Wenzee, accueil ») et le pied de page public ; favicon `public/wenzee-icon.svg`. Tests : `Brand.test.tsx`
et une vérification du logo dans `e2e/discover.spec.ts`.

## Jalon A atteint (fin du lot 5)

La boucle complète est cliquable : recherche → profil → demande → messagerie → devis → acceptation → réservation →
agenda. Mouss a demandé de continuer (« passe à la suite ») : on enchaîne les lots suivants, une PR par lot.

## Jalon B atteint (fin du lot 9)

Tous les écrans du MVP existent (plus aucune page « Bientôt disponible »), testés, avec une préview Vercel par PR.
Les 8 parcours Playwright de l'étape 3 passent sur ordinateur et sur mobile, plus la page compte et l'audit
d'accessibilité : 50 tests Playwright verts. Prochaine étape : **l'application mobile** (décision de Mouss le 22/11/2026, avant le back-end) ; le lot 10
(Supabase) est reporté à après.

## Ce que contient le lot 9

- Handlers (`mocks/handlers/auth.ts`) : `PATCH /api/me` (nom, téléphone, préférences ; un téléphone vide le retire)
  et `DELETE /api/me` (anonymisation RGPD, voir `regles-metier.md`). Hooks `useUpdateMe`, `useDeleteMe`.
- Web `features/account/` : **C8 « Mon compte »** (`/espace/compte`) : informations, tableau des notifications
  (sujet × canal), suppression du compte confirmée en tapant « SUPPRIMER ». Après la suppression, on passe par
  `/deconnexion` (qui transmet un message à l'accueil : « Ton compte a bien été supprimé »). Lien « Mon compte »
  ajouté au menu du compte.
- Web `features/static/` : **P7** `/comment-ca-marche`, `/faq` (accordéon `<details>`), `/cgu`, `/mentions-legales`,
  `/confidentialite`, gabarit `StaticPage`. Les textes juridiques sont **provisoires** et l'affichent
  (voir `questions-ouvertes.md` n° 6). Liens dans le pied de page public.
- `soon()` et `PlaceholderPage` supprimés : toutes les routes du MVP pointent vers une vraie page.
- **SEO** (`src/lib/seo.ts`, fonctions pures testées) :
  - `sitemap.xml` et `robots.txt` générés au build par un petit plugin Vite (`vite.config.ts`). Le plan du site vient
    du seed (pages fixes, catégories, profils publiés) ; il viendra de Supabase au lot 10.
  - Adresse du site : `SITE_URL`, sinon le domaine de production Vercel. Seule la production
    (`VERCEL_ENV=production`) est indexable : une préview répond `Disallow: /`.
  - Données structurées JSON-LD (`LocalBusiness` : ville, prix « à partir de », note si avis) sur chaque profil.
- **Accessibilité** : audit axe-core (`e2e/a11y.spec.ts`, WCAG 2.1 AA, zéro violation « serious »/« critical ») sur
  l'accueil, la recherche, un profil, la connexion, la FAQ, « Devenir prestataire » et l'espace client. Corrigé :
  les blocs « Chargement » ont `role="status"` (un `aria-label` sur une `div` sans rôle est interdit), et les jours
  passés des calendriers ont un contraste suffisant.
- Tests : `me.test.ts` (handlers), `accountForm.test.ts`, `AccountPage.test.tsx`, `StaticPages.test.tsx`,
  `seo.test.ts` ; Playwright `account.spec.ts` (compte, pied de page, JSON-LD) et `a11y.spec.ts`.

## Ce que contient le lot 8

- Handlers (`mocks/handlers/admin.ts`, réservés au rôle `admin`, 401/403 sinon) :
  `GET /api/admin/overview`, `GET /api/admin/providers/to-review`, `GET /api/admin/providers/:id` (fiche + propriétaire
  - historique), `POST /api/admin/providers/:id/moderate` (valider / corrections / refus avec motif),
    `GET /api/admin/reports?status=` (avec un aperçu de la cible), `POST /api/admin/reports/:id/resolve`
    (classer, masquer le contenu, suspendre l'auteur), `GET /api/admin/users?q=&page=` (recherche sans accents),
    `POST /api/admin/users/:id/status` (suspendre, bannir, réactiver, motif obligatoire).
- **Journal** : chaque décision écrit une `ModerationAction` (qui, quoi, motif).
- Effets : masquer un avis le passe en `hidden` et recalcule la note (règle n° 8) ; masquer un message remplace son
  texte ; masquer une photo la retire ; suspendre un compte bloque la connexion et sort son profil de la recherche
  (`published → suspended`), réactiver le remet en ligne. Un admin ne peut pas être suspendu.
- Vues : `adminOverviewSchema`, `adminProviderDetailsSchema`, `adminReportSchema` ; libellés `USER_ROLE_LABELS`,
  `USER_STATUS_LABELS`, `REPORT_STATUS_LABELS`, `MODERATION_ACTION_LABELS`. Hooks : `queries/useAdmin.ts`.
- Web (`features/admin/`) : A1 `/admin` (4 chiffres), A2 `/admin/prestataires` et la fiche `/admin/prestataires/:id`,
  A3 `/admin/signalements` (filtre par statut), A4 `/admin/utilisateurs` (recherche, pagination, suspension).
  Fenêtre à motif réutilisable : `ReasonDialog`. Tableaux simples (`AdminTable`), pas d'effort de design (prévu).
- Playwright : `e2e/admin.spec.ts` (parcours 6 : l'admin valide un profil, qui apparaît dans la recherche).

## Ce que contient le lot 7

- Handlers (`mocks/handlers/myProvider.ts`, qui reprend aussi `GET/PATCH /api/me/provider` du lot 5) :
  `POST /api/me/provider` (crée un brouillon et ajoute le rôle `provider`, règle n° 1), `PATCH /api/me/provider`
  (l'adresse `slug` suit le nom tant que le profil est un brouillon), `POST /api/me/provider/submit` (règle n° 2, 422 si
  incomplet), `POST /api/me/provider/pause`, formules (`POST/PUT/DELETE /api/me/provider/offerings`, le « à partir de »
  est recalculé avec `computePriceFrom`), galerie (`POST/DELETE /api/me/provider/media`, la 1re photo devient la couverture).
- `utils/slugify.ts` (`slugify`, `uniqueSlug`) ; libellés `PROVIDER_STATUS_LABELS`, `PRICING_TYPE_LABELS`, `LANGUAGE_LABELS` exporté.
- Hooks (`queries/useMyProvider.ts`, qui reprend `useMyProviderProfile` et `useUpdateMyProviderProfile`) :
  `useStartProviderOnboarding`, `useSubmitMyProviderProfile`, `useSetMyProviderProfilePaused`, `useSaveOffering`,
  `useDeleteOffering`, `useAddMedia`, `useDeleteMedia`.
- Web (`features/provider-onboarding/`) :
  - P6 `/devenir-prestataire` : argumentaire (« gratuit au lancement »), bouton qui crée le profil, met la session à jour
    (`setUser` du store) puis ouvre l'onboarding. Un visiteur passe d'abord par la connexion.
  - S1 `/pro/onboarding` : 7 étapes + récapitulatif, barre de progression, transition animée (Motion) entre étapes.
    Chaque « Continuer » enregistre l'étape et `onboardingStep` : on reprend là où on s'était arrêté.
    Le récapitulatif affiche la checklist de la règle n° 2 et envoie en validation.
  - S7 `/pro/profil` : les mêmes sections en onglets (`ProfileSections.tsx`, partagées avec S1), aperçu de la carte
    de recherche, pause / réactivation, lien vers la page publique.
  - Tableau de bord : bandeau tant que le profil n'est pas en ligne (brouillon, en validation, corrections, pause).
  - Schémas de formulaire séparés : `features/provider-onboarding/lib/profileForms.ts` ; euros ↔ centimes partagés
    dans `apps/web/src/lib/money.ts`.
  - Photos : fichier réduit à 1200 px et gardé en « data URL » dans la base mockée, ou photo d'exemple en un clic.
- Playwright : `e2e/onboarding.spec.ts` (parcours 5 : une cliente devient prestataire et envoie son profil).

## Ce que contient le lot 6

- Handlers (`mocks/handlers/reviews.ts`) : `POST /api/reviews` (règle n° 6 via `canReviewBooking`, puis note recalculée
  par `computeProviderRating`, règle n° 8), `POST /api/reviews/:id/reply` (une seule réponse, par le prestataire concerné),
  `GET /api/me/provider/reviews` (S8, avis masqués compris). Le signalement passe par `POST /api/reports` (lot 4).
- `BookingSummary` porte maintenant `review` (l'avis éventuel) : la carte de réservation sait si le bouton s'affiche.
- API : `listMyReviews()`. Hooks (`queries/useReviews.ts`) : `useCreateReview`, `useMyReviews`, `useReplyToReview`.
- Web (`features/reviews/`) :
  - C6 `/espace/avis/:bookingId` : note générale obligatoire, 3 sous-notes facultatives (« les trois ou aucune »),
    commentaire. Étoiles = boutons radio masqués (`StarRatingInput`, clavier et lecteurs d'écran inclus).
    Schéma de formulaire séparé : `features/reviews/lib/reviewForm.ts`. Après l'envoi, retour sur le profil avec
    « Merci ! Ton avis est publié. » et la nouvelle moyenne.
  - Bouton « Laisser un avis » sur la carte de réservation, seulement si `canReviewBooking` l'autorise ;
    sinon la note laissée s'affiche.
  - S8 `/pro/avis` : moyenne, avis sans réponse, sous-notes, réponse publique unique (`ReplyForm`), signalement
    (`ReportDialog`, motifs « faux avis », « contenu inapproprié », « autre »), badge « Masqué par la modération ».
- Playwright : `e2e/review.spec.ts` (parcours 4 : la cliente laisse un avis, la moyenne et le nombre d'avis changent).

## Ce que contient le lot 5

- Règle n° 5 : `canAcceptQuote` + `acceptQuote` (`packages/common/src/rules/acceptQuote.ts`, testées).
- Handlers : `POST /api/quotes`, `POST /api/quotes/:id/accept`, `POST /api/quotes/:id/decline`, `GET /api/bookings?side=`,
  `POST /api/bookings/:id/cancel`, `GET /api/me/provider/dashboard`, `GET/POST /api/me/provider/unavailabilities`,
  `DELETE /api/me/provider/unavailabilities/:id`, `GET/PATCH /api/me/provider` (le PATCH sert au réglage
  « max par jour » ; l'onboarding du lot 7 s'appuiera dessus). `mocks/bookings.ts` : `completePastBookings`, `toBookingSummary`.
- Hooks (`queries/useBookings.ts`) : `useCreateQuote`, `useAcceptQuote`, `useDeclineQuote`, `useBookings`,
  `useCancelBooking`, `useProviderDashboard`, `useMyUnavailabilities`, `useBlockDate`, `useUnblockDate`,
  `useMyProviderProfile`, `useUpdateMyProviderProfile`.
- Web :
  - S4 `/pro/demandes/:id/devis` : lignes dynamiques (`useFieldArray`), total et acompte en direct, montants saisis en
    euros « à la française » (`features/quotes/lib/quoteForm.ts`), reprise de la version précédente pour négocier.
  - C3 : devis détaillés (`QuoteCard`), « Accepter » (adresse + conditions d'annulation) / « Refuser » ;
    bloc réservation (`BookingPanel`) avec adresse révélée et annulation (`CancelBookingDialog`, remboursement prévu affiché).
  - C5 `/espace/reservations` ; S2 `/pro` (3 chiffres, demandes récentes, prochaines dates) ;
    S6 `/pro/agenda` (mois, réservé / bloqué / libre, clic pour bloquer/débloquer, réglage « max par jour »).
  - Grille de calendrier partagée : `apps/web/src/lib/calendar.ts`.
  - Maquette v2 : boutons en pilule, variante `cta` (soleil orangé) pour l'action principale d'un écran
    (Rechercher, Demander un devis, Envoyer, Accepter) ; menu pro brun (`SpaceNav tone="dark"`).
  - Correctif mobile : les textes `sr-only` des pastilles débordaient (page plus large que l'écran) → pastilles en `relative`.
    En-tête : texte court « Mode client / Mode pro » sur téléphone.
- Playwright : `e2e/booking.spec.ts` (parcours 2 et 3).

## Reste à faire côté maquette v2

- Accueil façon référence de Mouss : photo pleine largeur sous l'en-tête, grand titre avec mot accent (`text-title-accent`),
  recherche en pilule, bordure à motif de losanges. Logo piste 1 à intégrer quand le fichier final sera prêt.

## Ce que contient le lot 4

- Handlers MSW (`packages/common/src/mocks/handlers/quoteRequests.ts` et `messaging.ts`) :
  `POST/GET /api/quote-requests`, `GET /api/quote-requests/:id`, `POST …/:id/decline` (prestataire, avec motif),
  `POST …/:id/cancel` (client), `GET /api/conversations?side=`, `GET/POST /api/conversations/:id/messages`,
  `POST /api/conversations/:id/read`, `POST /api/reports`. Une demande ou conversation qui n'est pas à toi renvoie 404.
- Effets de bord regroupés dans `mocks/conversations.ts` : `postMessage` (masquage règle n° 7 + compteurs de non-lus),
  `expireStaleQuoteRequests` (expiration à 7 jours vérifiée à chaque lecture des demandes, avec message système),
  `extendQuoteRequestOnProviderReply` (une réponse du prestataire relance le délai de 7 jours).
- Règles appliquées côté serveur mocké : n° 3 (date indisponible → 409), n° 4 (soi-même → 403), n° 7 (masquage).
  Une demande déclinée, expirée ou annulée ferme la conversation (409 `conversation_closed`).
- Hooks : `useQuoteRequests`, `useQuoteRequest`, `useCreateQuoteRequest`, `useDeclineQuoteRequest`,
  `useCancelQuoteRequest`, `useConversations`, `useMessages`, `useSendMessage`, `useMarkConversationRead`,
  `useUnreadCount`, `useCreateReport`. Messagerie rafraîchie toutes les 7 s (`MESSAGING_REFRESH_MS`) en attendant le temps réel.
- Utilitaires : `formatEventDate`, `formatMessageTime`, `formatDateTime` (heure de Paris), `CLIENT_TYPE_LABELS`,
  `REPORT_REASON_LABELS`.
- Web :
  - C1 `/prestataires/:slug/demande` (protégée : connexion puis retour). Schéma de saisie à part
    (`features/quote-requests/lib/requestForm.ts`) : les champs HTML sont du texte et le budget est en euros ;
    `toCreateQuoteRequestInput` convertit en nombres et centimes. Après l'envoi : ouverture de la conversation (`?envoyee=1`).
    Date : champ natif (pas de Calendar shadcn) + vérification des jours pris avant l'envoi.
  - C2/C3 et S3 : une seule page par écran avec `side` en paramètre (`RequestsPage`, `RequestDetailPage`), onglets
    En cours / Réservations / Terminées (gardés dans `?onglet=`), « Poser une question », « Décliner » (motifs suggérés),
    « Annuler la demande ».
  - C4/S5 : `MessagesPage` partagée (liste + fil sur ordinateur, l'un ou l'autre sur téléphone), messages système
    centrés, avertissement « coordonnées masquées », Entrée pour envoyer, pastille de non-lus dans le menu.
  - `components/ReportDialog.tsx` : bouton « Signaler » réutilisable (message aujourd'hui, profil et avis plus tard).
- Playwright : `e2e/request.spec.ts` (parcours 1 et 7).

## Ce que contient le lot 3

- Recherche « serveur » : `searchProviders` (`packages/common/src/mocks/search.ts`, fonction pure testée) : catégorie (une
  catégorie principale inclut ses sous-catégories), origines, texte (sans accents), ville, date (règle n° 3), budget (les
  « sur devis » restent), invités, note, vérifié ; tri pertinence (note pondérée par le nombre d'avis) / note / prix ;
  pagination (12 par page).
- Handlers : `GET /api/providers` (recherche), `/api/providers/:slug` (profil public), `/:id/reviews`, `/:id/unavailable-dates`.
- Hooks : `useProviderSearch`, `useProvider`, `useProviderReviews`, `useUnavailableDates`, `useCulturalOrigins`.
- Utilitaires partagés : `formatOfferingPrice`, libellés français (`EVENT_TYPE_LABELS`, `LEGAL_TYPE_LABELS`, `languageLabel`).
- Web : filtres dans l'adresse en français (`features/search/lib/searchParams.ts` : `categorie`, `origines`, `ville`,
  `date`, `budget` en euros, `invites`, `note`, `verifie`, `tri`, `page`) ; accueil (P1) avec recherche Quoi/Où/Quand ;
  résultats (P2) ; pages catégorie (P4) avec titre pour Google (`usePageMeta`) ; profil (P5) avec galerie + visionneuse,
  formules, calendrier de disponibilités en lecture, avis, politique d'annulation, bouton « Demander un devis ».
- Transition douce entre les pages publiques (Motion, respecte « réduire les animations »).
- Thème : tokens de la maquette v1 appliqués (`packages/config/tailwind/theme.css`, copie JSON dans `tokens.json`). Nom et logo Wenzee depuis le 23/11/2026 (voir « Changement de marque »). Maquette : `/mnt/project-files/maquette/` et https://claude.ai/artifact/9bkx1UDkFjBKFEKMGTrVGv.

## Ce que contient le lot 2

- Composants shadcn/ui : Input, Textarea, Label, Select, Dialog, Tabs, Avatar, DropdownMenu, Form (React Hook Form).
  Composants maison : `Rating` (étoiles accessibles), `EmptyState`. Le Calendar arrivera avec le formulaire de demande (lot 4).
- Session dans Zustand (`apps/web/src/stores/session.ts`), gardée dans le localStorage ; le jeton part avec chaque appel API.
- Handlers MSW : `GET /api/auth/demo-accounts`, `POST /api/auth/demo-sign-in`, `GET /api/me`.
- 4 gabarits (public, client, pro avec menu latéral, admin) et le **routeur complet** : chaque page future a déjà son
  adresse et ses gardes, avec un contenu « Bientôt disponible (lot N) ».
- Gardes : `<RequireAuth />` et `<RequireAuth role="provider|admin" />` ; retour sécurisé avec `?retour=` (`safeRedirect`).
- Page de connexion de démo (`/connexion`), déconnexion (`/deconnexion`), bascule client ↔ prestataire, raccourci « Mon espace »,
  « Réinitialiser les données de démo » dans le menu du compte.

## Ce que contient le lot 1

- Schémas Zod de toutes les entités MVP (User, ProviderProfile, Category, CulturalOrigin, Offering, Media,
  Unavailability, QuoteRequest, Quote, QuoteLine, Booking, Conversation, Message, Review, Report, ModerationAction),
  des formulaires et des vues de l'API.
- Règles 1, 2, 3, 4, 6, 7, 8, 9 (voir [`regles-metier.md`](regles-metier.md)).
- `ApiClient` complet (≈ 50 opérations) et `createHttpApiClient` avec toutes les routes.
  **Handlers MSW existants** : `GET /api/categories`, `/api/cultural-origins`, `/api/providers/featured`.
  Les autres arrivent avec leur lot.
- Seed (26 prestataires, 3 comptes de démo, demandes dans chaque statut) + `mockDb` avec persistance.

## Questions en suspens pour Mouss

La liste complète (choix actuel, impact, échéance) est dans [`questions-ouvertes.md`](questions-ouvertes.md).

- Menu latéral pro en brun (`bg-sidebar`) à faire avec le tableau de bord S2 (lot 5).
- Préfixe des paquets : garder `@afro/…` ou passer à `@wenzee/…` (lot 11).

## Écarts assumés par rapport à la conception

- `Notification`, `Payment`, `Dispute`, `Favorite` : pas de schéma au MVP (prévu).
- `Quote.lines` : les lignes sont renvoyées dans le devis (pas de route séparée pour `QuoteLine`).
- `Booking` a en plus `quoteRequestId` et `cancelledAt` (pratique pour les écrans et la règle n° 9).
- `ProviderProfile.postalCode` peut être vide pour un brouillon d'onboarding.
- Lot 7 : modifier un profil déjà publié ne le renvoie pas en validation (choix de Mouss pour l'instant, voir [`questions-ouvertes.md`](questions-ouvertes.md) n° 1).
- Lot 8 : pas de notification au prestataire après une décision (le modèle `Notification` arrive avec les emails, lot 11) ;
  il voit son nouveau statut et le motif dans son espace.
- Lot 7 : pas d'upload réel au MVP mocké, les photos sont des « data URL » (vrai stockage au lot 10 avec Supabase).
- Page d'accueil : « à la une » = les 8 profils publiés les mieux notés (en attendant la mise en avant payante).
