# Avancement

Dernière mise à jour : 26/11/2026 (navbar animée au défilement).

## Site : navbar animée au défilement (26/11/2026)

Demande de Mouss : « des animations au scroll du header ». Branche `claude/header-scroll`, PR vers `dev`.
Captures (GIF ordinateur et mobile) : `/mnt/project-files/animations-accueil/header/`.

- **`hooks/useScrollHeader.ts`** (remplace `useScrolled.ts`) : `scrolled` (on a quitté le haut de la page) et
  `hidden` (on descend au-delà de 320 px ; faux dès qu'on remonte, petits mouvements de moins de 6 px ignorés).
- **`Navbar`**, sur toutes les pages : se compacte (barre et logo plus bas), **glisse hors de l'écran en descendant**
  et revient en remontant, **fil de lecture** orange (`bg-cta`) en bas de la barre (largeur = progression dans la
  page, via `useScroll` de Motion). Reste visible si le clavier est dedans (`focus-within`) ou si le menu
  « Prestataires » est ouvert.
- **« Réduire les animations »** : la barre ne se cache jamais et rien ne glisse (`useReducedMotion`,
  `motion-reduce:transition-none`).
- Tests : `useScrollHeader.test.ts`, `Navbar.test.tsx` (barre cachée puis revenue, fil de lecture),
  `e2e/header-scroll.spec.ts` (compactage, masquage, focus clavier, mouvements réduits) ; `e2e/hero.spec.ts` défile
  de 250 px au lieu de 800 (sinon la barre se cache).

## Branche `dev` et production (26/11/2026)

Demande de Mouss : « faire les dev sur une branche dev, la main servira de prod ».

- Branche **`dev`** créée depuis la dernière version de `main` (`9ae6ecd`) et poussée.
- Désormais, toutes les PR partent de `dev` et ciblent `dev` ; `dev` → `main` seulement quand Mouss le demande
  (règle détaillée : [`conventions.md`](conventions.md#branches-règle-de-mouss-26112026)).
- CI (`.github/workflows/ci.yml`) : lancée aussi à chaque push dans `dev`.
- Ménage du 26/11/2026 : les 13 branches déjà fusionnées sont à supprimer (par Mouss) ; ensuite, chaque branche
  est supprimée après la fusion de sa PR ([`conventions.md`](conventions.md)).
- Réglages GitHub et Vercel à faire par Mouss : voir « Ce que Mouss a à faire » dans
  [`questions-ouvertes.md`](questions-ouvertes.md).

## Données de démo : toutes les catégories (25/11/2026)

Demande de Mouss : « il me faudrait toutes ces catégories », d'après une capture du méga-menu d'un annuaire américain
de prestataires afro. 🔍 Branche `claude/project-thread-x72gw4`, à relire.

- **`packages/common/src/mocks/seed/catalogue.ts`** : 8 groupes et 50 sous-catégories, en français et adaptés à la
  France (détail et correspondance des anciens slugs : [`donnees-demo.md`](donnees-demo.md)). Format compact
  (`CATEGORY_GROUPS`) aplati en `seedCategories`.
- **11 prestataires ajoutés** pour que chaque groupe ait des résultats (37 au total, 33 publiés).
- **Clé du localStorage passée en `v2`** : sans ça, les navigateurs (site Vercel compris) gardaient l'ancien jeu.
- **Web** : rien à coder, le menu « Prestataires », la recherche et les pages catégorie lisent les catégories de l'API.
  Seuls les slugs des 8 catégories de l'accueil (`homeCategories.ts` : raccourcis du hero et mosaïque) suivent les nouveaux noms (Show → `musique-animation`,
  Beauté → `beaute-soins`, Mode → `mode-tenues`, Décoration → `deco-location`). Le méga-menu n'est pas codé.
- **Mobile** : 8 icônes (`categoryIcons.ts`, 4 nouvelles dessinées dans le même style), traductions anglaises des
  groupes (`i18n/en.ts`), photos de l'étape « Quoi ? » renommées par slug + Mode (recadrée depuis la maquette) ; les 3
  groupes sans photo affichent leur icône (question n° 18).
- **Tests** : `buildSeed.test.ts` (8 groupes, slugs uniques, toutes les catégories des prestataires existent),
  `search.test.ts` (chaque groupe a un prestataire publié), e2e `discover.spec.ts` (page « Photo & vidéo »),
  `search.test.tsx` mobile (icône à la place de la photo) ; les tests qui comptaient les résultats (22 → 33) ou citaient
  les anciens noms suivent.

## Site en ligne (Vercel)

Le 25/11/2026, Mouss a déployé `apps/web` sur Vercel : les pages étaient vides. Cause : Vercel construit en
mode « production », qui ne lit pas `.env.development`, donc `VITE_USE_MOCKS` était absent et MSW ne
démarrait pas (les appels `/api` partaient vers un serveur qui n'existe pas).

- `apps/web/.env.production` : `VITE_USE_MOCKS=true` tant que le back-end Supabase n'existe pas
  (test : `src/lib/envProduction.test.ts`). Le jour du back-end : `VITE_USE_MOCKS=false` dans les variables
  du projet Vercel (elles passent avant le fichier) ou dans ce fichier.
- `apps/web/vercel.json` : toutes les URL renvoient vers `index.html` (sinon un rechargement sur
  `/recherche` donne une 404). Les vrais fichiers (`mockServiceWorker.js`, `assets/`) restent servis tels quels.
- Les données fictives vivent dans le navigateur de chaque visiteur : ce qu'il modifie n'est vu que par lui.

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

| Lot  | Sujet                                      | État                                                             |
| ---- | ------------------------------------------ | ---------------------------------------------------------------- |
| M0   | Sprint planning                            | ✅ fusionné #15 (+ #16)                                          |
| M1   | Squelette Expo + monorepo + tests + CI     | ✅ fusionné #17 (testé par Mouss sur son téléphone avec Expo Go) |
| M2   | Thème NativeWind + composants de base      | ✅ fusionné #18                                                  |
| M3   | Données mockées sur téléphone              | ✅ fusionné #19                                                  |
| M4   | Onglets + splash animé + icône             | ✅ fusionné #20                                                  |
| M4b  | Barre d'onglets en verre rétractable       | ✅ fusionné #21                                                  |
| M5   | Connexion et inscription simulées          | ✅ fusionné #22                                                  |
| M6   | Accueil (P1)                               | ✅ fusionné #23                                                  |
| M6c  | Thème sombre / clair                       | ✅ fusionné #25                                                  |
| M6b  | Traduction anglaise                        | ✅ fusionné #26                                                  |
| M6d  | Loader Wenzee (logo du splash)             | ✅ fusionné #27                                                  |
| M7   | Recherche façon Airbnb                     | ✅ fusionné #28 (+ correctif encoche #29)                        |
| M8   | Profil prestataire (P5)                    | ✅ fusionné #30                                                  |
| M9   | Demande de devis en 3 étapes (C1)          | ✅ fusionné #31                                                  |
| M10  | Mes demandes et messagerie (C2, C4)        | ✅ fusionné #32                                                  |
| M11  | Devis et réservations (C3, C5)             | ✅ fusionné #33                                                  |
| M12a | Laisser un avis (C6)                       | ✅ fusionné #34                                                  |
| M12b | Compte (C8)                                | ✅ fusionné #35                                                  |
| M13  | Bascule pro et tableau de bord (S2)        | ✅ fusionné #36                                                  |
| M14a | Demandes reçues et messagerie pro (S3, S5) | ✅ fusionné #37                                                  |
| M14b | Envoyer un devis (S4)                      | ✅ fusionné #38                                                  |
| M15a | Agenda pro (S6)                            | ✅ fusionné #39                                                  |
| M15b | Profil pro et avis reçus (S7, S8)          | ✅ fusionné #40                                                  |
| M15c | Modifier son profil dans l'app (S7)        | ✅ fusionné #41                                                  |

## Site : pied de page unique (25/11/2026)

Demande de Mouss, d'après sa maquette. 🔍 Branche `feat/web-footer`, à relire. Validation :
[`docs/footer-validation.md`](../docs/footer-validation.md).

- `SiteFooter` dans les 4 gabarits : marque + réseaux sociaux, Découvrir, Je suis, Aide & Support, Restez informé,
  barre légale. 5 colonnes à partir de 1400 px, disposition tablette en dessous, 2 colonnes puis 1 sur mobile.
- Réseaux sociaux non cliquables (pas encore de comptes) ; lettre d'information sans back-end (message honnête) ;
  nouvelle page `/contact` « bientôt disponible » (question n° 17).
- Tests : `SiteFooter.test.tsx`, `e2e/footer.spec.ts` ; tests du logo et des pages légales adaptés.
- Au passage (demande de Mouss) : **pagination et bouton pause du carrousel du hero retirés** ; le défilement
  automatique, la pause au survol et le balayage restent (`docs/hero-integration-validation.md`, section 9).

## Site : la navbar du hero sur toutes les pages (25/11/2026)

Demande de Mouss. Validation : [`docs/navbar-validation.md`](../docs/navbar-validation.md).

- Les 4 gabarits (public, client, pro, admin) utilisent `Navbar` ; `AppHeader` est supprimé.
- Accueil : inchangé (transparente puis floutée). Ailleurs : collée en haut, fond brun dès le départ.
- Espaces : badge « Espace client / pro / Admin », bascule de mode (texte court jusqu'à 1280 px), menu du compte
  (prénom à partir de 1280 px). « Se connecter » ramène à la page en cours.
- « Prestataires » est souligné sur la recherche, les catégories et les profils.
- Tests : `Navbar.test.tsx` (autres pages, espace pro, lien actif), `auth.test.tsx`, `Brand.test.tsx` (logo clair).

## Site : section « Pourquoi Wenzee » (26/11/2026)

Demande de Mouss : « passe à la suite de l'accueil ». Reprise de la maquette `/mnt/project-files/maquette-accueil/`. 🔍 PR ouverte vers `dev`.

- Sous « Comment ça marche » (`features/home/components/WhyWenzeeSection.tsx`) : photo de fête à gauche (cadre ocre
  décalé), à droite surtitre « Pourquoi Wenzee », titre « Le lien entre **nos talents** et vos moments. », texte de
  mission, citation, lien « Découvrir notre mission » → `/comment-ca-marche`. Empilé sous 1024 px. Fond ivoire.
- Photo : `public/images/hero/celebration.webp` (déjà utilisée par le hero et la mosaïque), avec `srcSet`.
- Tests : `WhyWenzeeSection.test.tsx`, `e2e/why-wenzee.spec.ts` (côte à côte / empilé, photo chargée, pas de débordement).
- Suite de la maquette : le journal attend la réponse de Mouss (articles fictifs ou pas).

## Site : section « Prestataires à la une » (26/11/2026)

Demande de Mouss : refaire cette section « en se basant sur les sections du dessus » (hero, univers, deux façons).
Maquette d'ensemble inspirée de la structure d'afropro.com : `/mnt/project-files/maquette-accueil/`. ✅ Fusionné (#51).

- 4ᵉ section de l'accueil (`features/home/components/FeaturedProvidersSection.tsx`) : même grammaire que les sections
  au-dessus (surtitre entre tirets, titre Playfair « Des talents qui font **la différence.** » souligné ocre,
  bouton « Voir tous les prestataires » → `/recherche`). Fond ivoire (alterne avec le sable de la section précédente).
- Grille 1 / 2 / 4 colonnes (8 prestataires). Nouvelle carte `FeaturedProviderCard` : photo 4:3 avec zoom au survol,
  catégorie en pastille soleil, « Pro vérifié », nom en Playfair, ville, note, prix. Si la photo ne charge pas :
  dégradé + initiale. `ProviderCard` (résultats de recherche) reste inchangée.
- Tests : `FeaturedProvidersSection.test.tsx` (déplacés depuis `HomePage.test.tsx`), `e2e/featured.spec.ts`
  (4 par ligne sur ordinateur, empilées sur téléphone, pas de débordement, clic vers le profil).
- Correctif au passage : `UserTypesSection.test.tsx` attend la navigation (`waitFor`), il échouait déjà sur `dev`.
- À trancher plus tard : les photos de couverture de démo viennent de picsum.photos (photos aléatoires, pas « afro »).

## Site : section « Deux façons d'utiliser Wenzee » (25/11/2026)

Demande de Mouss, d'après sa maquette. ✅ Fusionné (#47). Méthode et cycles :
[`docs/user-types-section-validation.md`](../docs/user-types-section-validation.md).

- 3ᵉ section de l'accueil, sous « Explorez nos univers » : en-tête centré, deux cartes côte à côte (≥ 1024 px),
  **sans aucune photo** (illustrations vectorielles à partir des icônes lucide).
- Carte « Pour les prestataires » : « Référencer mon activité » → `/devenir-prestataire` ; « Déjà inscrit ? Se
  connecter » → `/connexion?retour=%2Fpro`. Carte « Pour les particuliers » : « Organiser mon événement » →
  `/recherche` ; connexion → `/connexion`.
- Données : `features/home/lib/userTypes.ts` ; composants `UserTypesSection`, `UserTypeCard`, `UserTypeIllustration`.
- **Fonds unis** (demande de Mouss) : cette section en sable clair (`bg-muted`), « Explorez nos univers » en ivoire,
  sans motifs ni cercles décoratifs.
- Tests : `UserTypesSection.test.tsx`, `e2e/user-types.spec.ts` ; `e2e/auth.spec.ts` cherche maintenant « Se
  connecter » en nom exact (les cartes ont des liens « Déjà inscrit ? Se connecter »).

## Site : section « Explorez nos univers » (25/11/2026)

Demande de Mouss, d'après sa maquette. ✅ Fusionné (#46). Méthode et cycles :
[`docs/categories-section-validation.md`](../docs/categories-section-validation.md).

- 2ᵉ section de l'accueil, sous le hero : texte éditorial à gauche (« Découvrez nos univers événementiels »,
  bouton « Voir toutes les catégories » → `/recherche`), **mosaïque photo asymétrique** à droite (8 cartes, DJ en grand).
- Cartes : photo pleine carte, dégradé, nom ; survol = carte soulevée + zoom léger ; lien vers `/recherche?categorie=…`.
- Données : `features/home/lib/homeCategories.ts` (source unique des 8 catégories, aussi utilisée par le hero) et
  `lib/categoryMosaic.ts` (photo, cadrage, place de chaque carte).
- Photos : `public/images/categories/` (vignettes de l'app) + photos du hero. **Pas de photo de DJ ni de mode** :
  provisoires (question n° 16).
- Tests : `ExploreCategoriesSection.test.tsx`, `e2e/explore.spec.ts`.

## Site : hero plein écran de l'accueil (25/11/2026)

Demande de Mouss, d'après sa maquette (image jointe à sa demande, non versionnée). ✅ Fusionné (#44). Méthode et bilan de chaque cycle : [`docs/hero-integration-validation.md`](../docs/hero-integration-validation.md).

- **Navbar de l'accueil** (`components/layout/Navbar.tsx`) : transparente sur la photo au chargement, puis collée en haut
  avec un fond brun translucide flouté dès qu'on défile (`hooks/useScrollHeader.ts`). Accueil, Prestataires (menu des
  catégories), Événements, Offres & Deals, Notre mission (→ `/comment-ca-marche`), Se connecter, S'inscrire
  (→ connexion de démo) ; connecté : « Mon espace » + menu du compte. Sur téléphone et tablette : menu latéral.
  Les autres pages publiques gardent `AppHeader`.
- **Hero** (`features/home/`) : photo en fond en carrousel (3 ambiances, fondu, zoom lent, auto toutes les 6 s, pause
  pendant les interactions et bouton pause, points + flèches clavier + balayage), titre « Trouvez les talents qui
  subliment vos événements. », `SearchBar` flottante (remplace `HeroSearchForm`), 8 catégories populaires vers la
  recherche filtrée, décor SVG (losanges, vague ivoire et bandes wax).
- `prefers-reduced-motion` : ni défilement automatique, ni zoom, ni fondu.
- **Logo** : `<Logo variant="light" />` = la version claire déjà utilisée par l'app (`public/wenzee-logo-light.svg`).
- **Photos** : `public/images/hero/` (WebP) : mariage, soirée, célébration (3ᵉ photo fournie par Mouss le 25/11).
- **Ajustement du 25/11** (retour de Mouss) : navbar plus compacte, sur une seule ligne de 1024 à 1920 px ; recherche
  ramenée à 1120 × 84 px (détail : section 6 de `docs/hero-integration-validation.md`).
- **Texte et recherche centrés** (demande de Mouss, 25/11) : sur desktop, la photo occupe tout le fond avec un voile
  centré (section 7).
- **Cœur « Favoris » retiré de la navbar** (demande de Mouss, 25/11) : `/favoris` reste accessible depuis le menu mobile.
- **Pages « bientôt disponible »** : `/evenements`, `/offres`, `/favoris` (`features/static/pages/ComingSoonPages.tsx`).
- **Tests** : `useCarousel.test.ts`, `HeroSection.test.tsx`, `Navbar.test.tsx` ; e2e `hero.spec.ts` ; `HomePage.test.tsx`,
  `auth.test.tsx`, `auth.spec.ts`, `discover.spec.ts`, `home.spec.ts` et `a11y.spec.ts` suivent les nouveaux textes.

## Ce que contient le lot M15c

M15c « sans les photos » (choix recommandé à Mouss) : les sections du profil se modifient dans l'app ;
les photos restent sur le site (l'envoi d'images depuis le téléphone viendra plus tard).

- **Formulaires partagés** : `profileForms.ts` passe du site à `packages/common/src/utils/` (comme `quoteForm`),
  avec ses messages dans `profileFormMessages` (traduits en anglais via `errorKeyOf`). Le site l'importe de
  `@afro/common` : mêmes règles et mêmes messages sur le site et dans l'app.
- **Mon profil** : les lignes Présentation, Formules, Zone, Annulation et Informations légales s'ouvrent dans l'app ;
  seule la ligne Photos ouvre encore le site.
- **`/pro/modifier/[section]`** (`EditProfileSectionScreen`, sections `presentation`, `zone`, `annulation`, `legal`) :
  - Présentation : nom commercial, bio (compteur), catégories (5 max), origines (5 max), langues ;
  - Zone et capacité : ville, code postal, rayon de déplacement, réservations max par jour ;
  - Annulation : les 3 politiques en cartes, avec leurs règles de remboursement ;
  - Infos légales : statut et SIRET (14 chiffres, espaces tolérés).
  - « Enregistrer » en bas, toujours visible ; les erreurs s'affichent après le premier essai ; une fois enregistré,
    retour à « Mon profil ».
- **`/pro/formules`** (`OfferingsScreen`) : la liste des formules (prix, catégorie, invités, « Masquée »),
  « Ajouter une formule », « Modifier », « Supprimer » avec confirmation.
- **`/pro/formules/[id]`** (`OfferingFormScreen`, `nouvelle` pour ajouter) : catégorie, titre, description,
  type de prix, prix en euros (« 28,50 », enregistré en centimes, caché si « sur devis »), invités min / max, visible.
- **Tests** : `profileEdit.test.tsx` (chaque section : erreur puis enregistrement ; ajouter, modifier, supprimer une
  formule), `profileEdit.test.ts`, `formErrors.test.ts` ; les tests de `profileForms` ont suivi le fichier dans common.

## Ce que contient le lot M15b

- **L'onglet Profil** (`ProProfileScreen`, maquette S7) :
  - l'aperçu de sa carte dans la recherche (`ProviderCard preview`, qui ne s'ouvre pas) et l'état du profil ;
  - la note « en pause » ou « corrections demandées », et « Terminer mon inscription sur le site » si besoin ;
  - les sections : **Avis reçus** (pastille « N sans réponse ») s'ouvre dans l'app ; Présentation, Formules (nombre),
    Photos (nombre), Zone, Annulation et Informations légales **s'ouvrent sur le site** pour l'instant
    (`SITE_PAGES.providerProfile`) : elles arrivent dans l'app au lot M15c ;
  - **« Profil visible »** : un interrupteur qui met en pause (ou réactive) le profil ;
  - « Voir ma page publique » (si en ligne) et « Revenir en mode client ».
- **Avis reçus** (`/pro/avis`, `ReceivedReviewsScreen`, S8) : la note (règle n° 8), chaque avis avec ses sous-notes,
  et la **réponse publique**, obligatoire et unique (`reviewReplyMessages`, traduit).
- L'écran provisoire `ProSoonScreen` est supprimé : tous les onglets pro sont remplis.
- **Tests** : `proProfile.test.tsx` (aperçu et sections, section ouverte sur le site, pause puis réactivation,
  répondre à un avis).

## Ce que contient le lot M15a

M15 est découpé en petites PR : **M15a, l'agenda** (S6), **M15b, le profil pro** (S7), puis **M15c, modifier les
sections du profil dans l'app**.

- **L'onglet Agenda** (`AgendaScreen`, maquette S6), mêmes règles que la page Agenda du site :
  - le mois en grand, avec les flèches (on ne remonte pas avant le mois en cours) ;
  - **réservé** (fond terre) : toucher le jour ouvre la demande, qui montre maintenant « La réservation » (adresse,
    montants, politique) en lecture seule (`BookingPanel side="provider"`) ;
  - **bloqué** (barré) : toucher le libère ; **libre** : toucher le bloque. Les jours passés ne se touchent pas ;
  - dessous : les réservations du mois, puis **« Réservations max par jour »** (1 à 20, règle n° 3), avec
    « Enregistrer » qui n'apparaît qu'après un changement.
- VoiceOver lit l'état de chaque jour et ce que fait le toucher (« samedi 19 décembre 2026, libre, toucher pour
  bloquer »).
- Codes d'erreur du serveur traduits : `already_blocked`, `booked_date`, `not_provider`, `not_found`,
  `invalid_input`.
- **Tests** : `agenda.test.tsx` (bloquer puis libérer, jour réservé → la demande, réglage max par jour).

## Ce que contient le lot M14b

- **Le formulaire de devis passe dans common** (`packages/common/src/utils/quoteForm.ts`, avec `money.ts` :
  `eurosToCents`, `centsToEuros`) : le site et l'app ont les mêmes règles et les mêmes calculs (`liveTotals`,
  `initialQuoteForm`, `toCreateQuoteInput`). Ses messages (`quoteFormMessages`) sont traduits via `errorKeyOf`. Le
  site importe désormais tout ça depuis `@afro/common`.
- **« Nouveau devis »** (`/pro/devis/[id]`, `QuoteFormScreen`, maquette S4), ouvert par le bouton « Envoyer un devis »
  du détail de la demande (ou « Nouvelle version du devis ») :
  - les lignes, ajoutées une à une : libellé, quantité × prix unitaire, total de la ligne, poubelle pour l'enlever ;
  - l'acompte en %, la validité (7, 14 ou 30 jours, la date s'affiche), des conditions facultatives ;
  - **en bas, toujours visibles** : le total et l'acompte calculés en direct, et « Envoyer » ;
  - pour négocier, la nouvelle version **reprend les lignes de la précédente**, qui est remplacée.
- Après l'envoi : retour au détail (`router.dismissTo`, avec `?sent=1`) qui annonce « Devis envoyé ! ». Le client
  voit le devis dans la conversation, avec « Accepter le devis » (lot M11).
- **Tests** : `quoteForm.test.tsx` (erreurs, total 3 150 € et acompte 945 € comme la maquette, envoi vu côté client,
  nouvelle version, demande close) ; les tests unitaires du calcul ont suivi le formulaire dans common.

## Ce que contient le lot M14a

M14 est découpé en deux petites PR : **M14a, les demandes reçues et la messagerie pro**, puis **M14b, envoyer un
devis** (S4).

- **Les onglets pro passent dans une pile** : `app/pro/_layout.tsx` est une pile (Stack), les 5 onglets sont dans
  `app/pro/(tabs)/` (les adresses ne changent pas : `/pro`, `/pro/demandes`…). Ça permet d'ouvrir un détail
  **par-dessus** les onglets, sans la barre : `/pro/demande/[id]` et `/pro/conversations/[id]`.
- **Demandes reçues** (onglet Demandes, S3) : le même écran que « Mes demandes » du client, avec `side="provider"` :
  titre « Demandes reçues », une carte par client (avatar, « Aïssatou D. »), le badge d'urgence du tableau de bord,
  onglets En cours / Réservées / Archivées. Une demande du tableau de bord s'ouvre aussi en la touchant.
- **Le détail d'une demande** (`ProRequestDetailScreen`) : le client et la date de réception, l'événement (avec
  « Organisé » : particulier ou entreprise), son message, **la disponibilité vérifiée** (« Tu es libre ce jour-là »
  ou non, lue dans les jours indisponibles, comme la recherche), le dernier devis envoyé, la date d'expiration.
  En bas : **Message** et **Décliner**.
- **Décliner** (`DeclineRequestSheet`) : un panneau du bas, trois motifs proposés à toucher ou un motif libre,
  obligatoire (`quoteRequestMessages.declineReasonRequired`, traduit). Le client lit le motif dans la conversation.
- **Messagerie pro** (S5) : la liste et la conversation du client, avec `side="provider"` (nom du client, pas de
  boutons Accepter / Refuser sous les devis). Pastille des non-lus sur l'onglet Messages pro
  (`useUnreadMessages(side)`, qui remplace `useClientUnreadCount`).
- Correctif M13 : le nom du client s'affichait avec deux points (« D.. ») ; `clientName` le corrige.
- **Tests** : `proRequests.test.tsx` (liste, détail, jour pris, décliner, répondre, devis sans boutons) et
  `clientName.test.ts`.

## Ce que contient le lot M13

- **La bascule client ↔ pro** : dans Compte, un prestataire voit « Passer en mode pro » (les autres gardent
  « Devenir pro », qui ouvre le site). Le mode est retenu (`src/stores/mode.ts`, `wenzee:mode`) : en rouvrant l'app,
  un prestataire en mode pro arrive directement sur son tableau de bord. « Revenir en mode client » est dans l'onglet
  Profil pro.
- **La barre d'onglets brune** (`app/pro/_layout.tsx`, `ProTabsLayout`) : la même barre en verre, variante `pro`
  (brun fumé dans les deux thèmes, pour savoir où l'on est). Onglets Tableau, Demandes (pastille = demandes à
  traiter), Messages, Agenda, Profil. Les adresses sont `/pro`, `/pro/demandes`… Garde `ProOnly` : il faut être
  connecté **et** prestataire.
- **Le tableau de bord** (`/pro`, `DashboardScreen`) : bonjour, nom de l'activité et statut du profil ; les
  3 chiffres (demandes à traiter, réservations à venir, note) ; « À traiter » : demandes en attente triées par
  expiration, badge rouge « Expire dans N j » à 2 jours ou moins (`requestUrgency.ts`) ; « Prochaines dates ».
  Données : `GET /api/me/provider/dashboard` (`useProviderDashboard`, comme sur le site).
- Demandes et Messages pro arrivent en M14, Agenda et Profil en M15 : ces onglets affichent « Bientôt ».
- **Tests** : `pro.test.tsx` (bascule réservée aux prestataires, chiffres et demandes affichés, retour client) et
  `requestUrgency.test.ts`.

## Ce que contient le lot M12b

- **L'onglet Compte** (C8, `src/features/account/AccountScreen.tsx`) :
  - En haut : l'avatar, le nom et l'email.
  - **L'encart brun** : « Tu es prestataire ? Devenir pro » ouvre la page « Devenir prestataire » du site (l'inscription
    pro se fait là-bas). Pour un prestataire : « Passer en mode pro » (depuis M13).
  - **Mes informations** (`/mon-compte/informations`) : prénom, nom, téléphone vérifié (l'email ne se change pas
    encore), « Enregistrer » ; puis **« Supprimer mon compte »** avec confirmation. Le serveur anonymise le compte
    (question n° 7) et refuse s'il reste une réservation à venir (message traduit). Supprimé : déconnecté, retour à
    l'accueil.
  - **Notifications** (`/mon-compte/notifications`) : pour chaque sujet (demandes et devis, messages, réservations,
    nouveautés), un interrupteur par canal (email, SMS, notification). Rien n'est envoyé en démo.
  - **Apparence** (Automatique / Clair / Sombre) et **Langue** (Automatique / Français / English) dans un panneau du
    bas (`ChoiceSheet`). Les deux choix sont **gardés sur le téléphone** (`themeStore`, `i18n/languageStore`, rechargés
    au démarrage dans `prepareDemoData`).
  - **Aide et FAQ** et les **pages légales** (CGU, confidentialité, mentions légales) ouvrent les pages du site : un
    seul texte à tenir à jour, et les textes juridiques sont encore provisoires (question n° 6).
  - **Réinitialiser les données de démo** avec confirmation (`resetDemoData` : la base repart du jeu de démo ; un
    compte créé pendant les essais est déconnecté). **Se déconnecter**.
- L'adresse du site est dans `src/lib/site.ts` (`EXPO_PUBLIC_SITE_URL`, sinon l'adresse fictive
  `https://wenzee.example`, **à changer** quand le site aura son domaine, question n° 14).
- **Partagé avec le site** : le formulaire du compte (`accountFormSchema`, `accountDefaults`, `toUpdateMeInput`, les
  clés des notifications) passe dans `packages/common/src/utils/accountForm.ts`. Les messages `userMessages` (nom,
  téléphone) sont traduits.
- Pas fait : la ligne « Mes avis » de la maquette (la liste de mes avis laissés), pas prévue dans le lot ; à ajouter
  si tu la veux.
- Textes : `account.*` et les codes d'erreur de suppression dans `apiErrors`.
- Tests : 267 tests mobiles. `account.test.tsx` (qui je suis et liens vers le site, apparence et langue, réinitialiser,
  modifier mes informations, notifications, suppression refusée puis acceptée), `demoData.test.ts` (réinitialisation)
  et `languageStore.test.ts`.
- **Jalon M1** : avec ce lot, tout le parcours client est là. C'est le moment de tester sur ton téléphone.

## Ce que contient le lot M12a

M12 est découpé en deux petites PR : **M12a, laisser un avis**, puis **M12b, le compte**.

- **Laisser un avis** (C6, `src/features/reviews/LeaveReviewScreen.tsx`), à l'adresse `/avis/[id]` (id = la
  réservation), ouvert par « Laisser un avis » dans Mes réservations (M11).
  - En haut : le prestataire et la date de l'événement.
  - **Ta note générale** : 5 grandes étoiles faciles à toucher (`src/components/StarRatingInput.tsx`, un groupe de
    boutons radio pour VoiceOver), et le mot qui va avec (« Très bien »). Obligatoire.
  - **Détails (facultatif, les trois ou aucun)** : qualité, ponctualité, rapport qualité-prix, en petites étoiles.
  - **Ton commentaire** (facultatif), public avec le prénom et l'initiale du nom.
  - « Publier mon avis » : « Merci ! Ton avis est publié. » et un bouton vers le profil du prestataire. Le serveur
    recalcule sa note (règle n° 8) et le bouton disparaît de Mes réservations.
  - **Règle n° 6** vérifiée avant le formulaire (`canReviewBooking`) : avant l'événement ou avis déjà donné, l'écran
    explique pourquoi au lieu du formulaire.
- **Partagé avec le site** : le formulaire (`reviewFormSchema`, `initialReviewForm`, `toCreateReviewInput`) passe de
  `apps/web/src/features/reviews/lib/reviewForm.ts` à `packages/common/src/utils/reviewForm.ts`, avec ses messages
  dans `reviewMessages` (traduits dans l'app).
- Textes : `review.*` et les codes d'erreur des avis dans `apiErrors`.
- Tests : 258 tests mobiles. `reviews.test.tsx` (note obligatoire, sous-notes « les trois ou aucune », avis enregistré
  et note du prestataire recalculée, lien vers le profil ; pas de formulaire avant l'événement ; réservation
  inconnue). Le test du formulaire passe dans `packages/common`.

## Ce que contient le lot M11

- **Accepter ou refuser un devis** (C3, `src/features/bookings/QuoteActions.tsx`) : sous le dernier devis, dans le
  détail d'une demande **et** dans le fil de la conversation, « Refuser » et « Accepter le devis ». Rien ne s'affiche
  si le devis n'attend plus de réponse (remplacé, expiré, déjà accepté).
  - « Refuser » demande une confirmation sur place ; la demande reste ouverte pour une nouvelle version.
  - « Accepter le devis » ouvre un **panneau du bas** (`src/components/BottomSheet.tsx`, maquette C3) : prestataire et
    total, acompte, **adresse de l'événement** (révélée au prestataire seulement maintenant), **conditions
    d'annulation** (lues sur le profil complet), **case à cocher obligatoire**, « Le paiement se fait directement avec
    le prestataire », puis « Accepter et réserver ». Le serveur applique la règle n° 5 (`canAcceptQuote`) : ses refus
    s'affichent traduits (`apiErrors.quote_expired`…).
  - Une fois accepté : « Réservation confirmée ! » et la section **Ma réservation** dans le détail.
- **Ma réservation** (`BookingPanel`, dans `/demande/[id]`) : adresse, total, acompte, politique d'annulation, et
  « Annuler la réservation » (avant le jour J). Avant de confirmer, l'app affiche **ce que prévoit la politique**
  (règle n° 9, `computeCancellationRefund` : « L'événement est dans 18 jours : 50 % de l'acompte… »), et demande un
  motif.
- **Mes réservations** (C5, `/reservations`, bouton « Mes réservations » en haut de l'onglet Demandes) : deux onglets.
  - **À venir** (la plus proche d'abord) : grande photo, badge « Confirmée », prix, « sam. 12 déc. · dans 18 jours »,
    adresse, boutons « Message » (le fil) et « Annuler » (le détail, où se trouve l'annulation).
  - **Passées** (annulées comprises) : une ligne, et **« Laisser un avis »** seulement si c'est permis (règle n° 6,
    `canReviewBooking` : après l'événement, un seul avis). Sinon « Avis laissé : 4/5 ».
  - « Laisser un avis » ouvre `/avis/[id]` (le formulaire arrive en M12a).
- `bookings/bookingStatus.ts` : à venir ou passée, annulable ou non, badge traduit (`bookingStatus.*`).
- La case à cocher (`Checkbox`) passe de `features/auth/components/` à `src/components/` : elle sert maintenant à deux
  endroits.
- Les messages des schémas `acceptQuoteMessages` (schemas/quote.ts) et `cancelBookingMessages` (schemas/booking.ts)
  sont sortis en constantes pour être traduits (`errors.*`), comme ceux de la demande de devis.
- Textes : `quoteCard.*` (accepter, refuser), `acceptQuote.*`, `cancellationPolicies.*`, `bookings.*`,
  `bookingStatus.*`, et les codes d'erreur d'acceptation et d'annulation dans `apiErrors`.
- **Pas encore là** : le téléphone du prestataire après réservation (maquette C5). L'API ne le renvoie pas encore
  (question n° 13).
- Tests : 255 tests mobiles. `bookings.test.tsx` (accepter avec adresse et case obligatoires puis réservation créée,
  refuser avec confirmation, boutons dans la conversation, réservations à venir / passées et « Laisser un avis »,
  pas de bouton si l'avis existe, annulation avec motif et remboursement affiché, liste vide) et
  `bookingStatus.test.ts`.

## Ce que contient le lot M10

- **Messagerie** (C4, `src/features/messaging/`) :
  - L'onglet **Messages** : une conversation par demande, la plus récente en haut, l'aperçu du dernier message
    (« Toi : … » si c'est le mien), et la pastille soleil des non-lus (aussi sur l'onglet, déjà là depuis M4).
    Tirer vers le bas recharge ; sans conversation, un état vide renvoie vers la Recherche.
  - Le **fil** (`/conversations/[id]`, par-dessus les onglets) : en-tête avec le prestataire, l'événement et le badge
    de la demande ; les messages (les miens à droite en terre), les messages automatiques au centre, et **les devis
    dans le fil** (`QuoteCard` : lignes, total, acompte ; accepter et refuser depuis M11). Les coordonnées masquées par le
    serveur (règle n° 7) s'affichent en pastille « coordonnées masquées », avec « Les coordonnées s'affichent après
    la réservation ». La zone d'écriture reste collée au clavier ; une demande close ferme la conversation.
  - Rafraîchi toutes les 7 s (`MESSAGING_REFRESH_MS`, comme le site) ; le fil est marqué lu à l'ouverture.
  - « Ouvrir la conversation » (fin de la demande de devis, M9) ouvre maintenant le bon fil.
- **Mes demandes** (C2, `src/features/requests/`) :
  - L'onglet **Demandes** : trois onglets « En cours · 3 », « Réservées · 1 », « Terminées » (`requestTab`), une carte
    par demande (photo, prestataire, badge, « Mariage · sam. 12 déc. · 120 invités », total du devis).
  - Le **détail** (`/demande/[id]`) : badge, événement, lieu, budget, mon message, le dernier devis, « Poser une
    question » (le fil) et « Annuler la demande » avec confirmation (demande en attente ou avec devis).
  - Les badges (`messaging/requestStatus.ts`) suivent les mêmes règles que le site, traduits (`requestStatus.*`).
- Les adresses `/conversations/[id]` et `/demande/[id]` évitent de se mélanger avec les onglets `/messages` et
  `/demandes`.
- Textes : `messages.*`, `quoteCard.*`, `requestStatus.*`, `requests.*`.
- Tests : 245 tests mobiles. `messaging.test.tsx` (connexion demandée, liste et non-lus, fil marqué lu avec le devis,
  envoi avec numéro masqué, conversation fermée, liste vide) et `requests.test.tsx` (3 onglets et badges, détail et
  « Poser une question », annulation confirmée, liste vide), plus `requestStatus.test.ts` et `dates.test.ts`.

## Ce que contient le lot M9

- **La demande de devis en 3 étapes** (maquette C1), à l'adresse `/prestataires/[slug]/demande` (comme sur le site),
  ouverte par « Demander un devis » sur un profil. Écran dans `src/features/quote-request/`.
  - Il faut être connecté : sinon, le panneau « Connecte-toi » (`SignInRequired`), puis retour ici.
  - En haut : Retour, « Demande de devis », « 2 / 3 » et la barre de progression ; une carte rappelle le prestataire.
  - **1 · Formule** : une des formules actives, ou « Je ne sais pas encore ». `?formule=<id>` la présélectionne.
  - **2 · Événement** : type (pastilles), date (le `Calendar`, à partir de demain, jours pris barrés en rouge),
    invités, budget min et max en euros, ville et code postal. En passant à l'étape 3, on vérifie les champs et
    **la date (règle n° 3)** : un jour pris est refusé avec « Ce prestataire n'est pas disponible ce jour-là ».
  - **3 · Message** : qui organise (à titre personnel / entreprise ou association) et le message (20 caractères
    minimum). Les erreurs du serveur s'affichent traduites (codes de `canSendQuoteRequest` dans `apiErrors`).
  - **« Demande envoyée ! »** : 7 jours pour répondre, le récapitulatif (« Mariage · sam. 12 déc. · 120 invités »,
    « Saint-Denis · budget 2 000 € à 3 000 € »), « Ouvrir la conversation » et « Retour à l'accueil ».
  - Sur son propre profil (compte « les deux »), un avertissement et l'envoi bloqué (règle n° 4).
- **Partagé avec le site** : le formulaire (`quoteRequestFormSchema`, `toCreateQuoteRequestInput`) passe de
  `apps/web/src/features/quote-requests/lib/requestForm.ts` à `packages/common/src/utils/quoteRequestForm.ts`.
  Ses messages sont dans `quoteRequestMessages` (schemas/quoteRequest.ts), ce qui permet de les traduire dans l'app.
- Textes : `quote.*`, `eventTypes.*`, `clientTypes.*`, les erreurs du formulaire et les codes d'erreur de la demande.
- **En attendant M10** : « Ouvrir la conversation » ouvre l'onglet Messages (encore « Bientôt »). La conversation est
  bien créée par le serveur.
- Tests : 232 tests mobiles. `quote.test.tsx` couvre la connexion demandée, le parcours complet (avec les erreurs de
  chaque étape et la demande enregistrée), le jour indisponible refusé, l'erreur du serveur traduite, la formule
  présélectionnée et le blocage sur son propre profil. `quoteSummary.test.ts` pour le récapitulatif.

## Ce que contient le lot M8

- **Le profil d'un prestataire** (maquette P5), à l'adresse `/prestataires/[slug]` comme sur le site
  (`app/prestataires/[slug]/index.tsx`, écran dans `src/features/provider-profile/`). On l'ouvre en touchant une carte
  de l'Accueil (« À la une ») ou de la Recherche (`profileHref`).
  - `ProfileGallery` : les photos (couverture puis galerie) défilent de côté, compteur « 1 / 8 photos », bouton Retour.
    Toucher une photo l'ouvre en grand dans une visionneuse plein écran sur fond noir.
  - En-tête : « Vérifié », origines, nom, note, nombre d'avis, ville et rayon de déplacement.
  - Quatre onglets : **Formules** (formules actives avec prix, invités, durée, puis « À propos »), **Avis** (note,
    avis avec date et réponse du prestataire), **Dispos** (le `Calendar` en lecture seule : jours pris barrés, lus
    « indisponible » par VoiceOver ; on change de mois et les dispos se rechargent), **Infos** (zone, langues,
    origines, temps de réponse, statut, politique d'annulation, « Signaler ce profil »).
  - En bas, toujours visible : « À partir de … » et **« Demander un devis »**. Sans compte, le bouton ouvre la
    connexion en retenant le profil (on y revient après). Connecté, il ouvre `/prestataires/[slug]/demande`, un écran
    « Bientôt disponible » en attendant le formulaire du lot M9.
  - **Signalement** : un motif (arnaque, contenu inapproprié, spam, autre), des détails facultatifs, puis l'envoi
    (`useCreateReport`, il arrive dans l'admin du site). Il faut être connecté.
  - Chargement avec le loader Wenzee ; « Profil introuvable » pour une adresse inconnue.
- Textes : nouvelles clés `profile.*`, `calendar.*` et `languages.*` (noms des langues) dans `@afro/common/i18n`.
  Les prix des formules, les invités, la durée et la politique d'annulation sont traduits dans `profileText.ts`
  (mêmes règles que le site, qui garde ses textes français dans `common`).
- Déplacés pour être partagés : `Calendar` → `src/components/`, les dates → `src/lib/dates.ts`.
- **Écarts avec la maquette** : pas de cœur (favoris C7, après le MVP) ni de bouton Partager (il faudra l'adresse
  publique du site pour partager un lien).
- Tests : 223 tests mobiles. `profile.test.tsx` couvre le chargement et les formules, la visionneuse, les avis, les
  dispos, les infos, le bouton devis sans compte puis connecté, le signalement, le profil introuvable et l'ouverture
  depuis une carte de la Recherche. `profileText.test.ts` et `dates.test.ts` pour les petites fonctions.

## Ce que contient le lot M7

- **L'onglet Recherche façon Airbnb** (maquette section 8, validée par Mouss le 24/11), dans `src/features/search/` :
  - `SearchPill` : la pilule du haut qui résume la recherche (« Nourriture · Paris », « sam. 14 déc. · 80 invités »),
    la flèche qui efface tout, et le bouton Filtres avec le nombre de filtres actifs.
  - `CategoryBar` : la rangée de catégories à icônes, soulignée sur la catégorie choisie.
  - `SearchResultCard` : grandes cartes photo (pastille « Vérifié », note, catégorie et ville, prix « dès … »).
  - `SearchWizard` : la recherche en plein écran, en 4 étapes repliables (Quoi ? → Où ? → Quand ? → Combien
    d'invités ?). Chaque choix ferme son étape et ouvre la suivante (`LayoutAnimation`). Rien n'est appliqué avant
    « Rechercher ». `Calendar` : un mois, jours passés barrés.
  - `FiltersSheet` : les filtres en plein écran (tri, budget avec histogramme et curseur `BudgetSlider`, note
    minimale, origines, profils vérifiés), avec « Voir N prestataires » compté en direct.
  - Chargement : le loader Wenzee ; la page suivante se charge en arrivant en bas (`useInfiniteProviderSearch`,
    nouveau dans `common`). « Aucun résultat » avec « Retirer les filtres ».
- **Les filtres vivent dans l'adresse de l'écran** (`/recherche?categorie=nourriture&ville=Paris&date=…`), avec les
  mêmes noms que sur le site : `filtersFromParams` / `paramsFromFilters` / `countActiveFilters` sont passés du site
  à `packages/common/src/utils/searchParams.ts` (et leurs tests avec). `useSearchFilters` (mobile) les lit avec
  `useLocalSearchParams` et les écrit avec `router.setParams`. L'Accueil ouvre donc une recherche toute prête.
- **Écarts avec la maquette**, faute de données ou de fonctionnalité pour l'instant :
  - une seule photo par carte, sans points de défilement, car la recherche ne renvoie que la photo de couverture ;
  - pas de cœur, car les favoris (C7) sont prévus après le MVP ;
  - pas de « Autour de moi » ni de « Recherche récente » ;
  - un seul curseur de budget (maximum), car le serveur ne filtre pas sur un minimum.
- **Correctif après le test de Mouss (24/11)** : la Recherche et les Filtres plein écran passaient sous l'heure et
  l'encoche du téléphone. Une `<Modal>` s'ouvre dans une fenêtre native à part, hors du `SafeAreaProvider` de l'app :
  `src/components/FullScreenModal.tsx` lui donne le sien (démarré avec les marges de l'app) et réserve aussi la barre
  du bas sur Android. À réutiliser pour tout écran plein écran.
- Les villes proposées à l'étape « Où ? » sont celles des prestataires (les plus fournies d'abord) ; le vrai serveur
  aura sa propre liste (lot 10).
- Tests : 203 tests mobiles. `search.test.tsx` couvre :
  - chargement puis cartes ;
  - catégorie dans l'adresse ;
  - parcours complet Quoi → Où → Quand → Invités → Rechercher ;
  - « Tout effacer » et croix ;
  - filtres avec compte en direct ;
  - « Aucun résultat » ;
  - flèche qui efface ;
  - page suivante ;
  - dates FR et EN.

  Recherche en anglais dans `english.test.tsx`.

## Ce que contient le lot M6d

- **Le loader Wenzee** (`src/components/brand/WenzeeLoader.tsx`), d'après la maquette section 9 validée par Mouss
  le 24/11 : le logo du splash qui se dessine en boucle (1,8 s). La boucle se trace, le lien orange s'y noue, le
  losange apparaît, puis tout s'efface et recommence. Boucle rouille en thème clair, ivoire en thème sombre ou avec
  `onDark` (sur une photo, le menu brun). « Réduire les animations » : logo entier qui respire doucement.
- Utilisation : `<WenzeeLoader size={110} message="…" />` (110 pleine page, 64 une section, 36 une liste). Il se
  présente à VoiceOver comme une barre de progression, nommée par `label`, sinon `message`, sinon « Chargement ».
- Il remplace les roues grises : `QueryState` (Accueil, et tous les futurs écrans qui chargent) et les comptes de
  démo. Le bouton « en cours » garde sa petite roue (le logo serait illisible dans un bouton). Visible aussi dans
  l'écran de développement « Composants ».
- Les tracés du logo sont partagés avec le splash : `src/components/brand/logoPaths.ts` (ex-`splashPaths.ts`).
  Les étapes du dessin sont une fonction pure, `loaderFrame(t)`, testée sans animation.
- **Correctif des tests** : `expo-router/testing-library` remplaçait Reanimated par un objet vide dans les tests qui
  l'importent. Notre faux est maintenant branché dans `jest.config.js` (`moduleNameMapper`), pour les deux noms
  (`react-native-reanimated` et `react-native-reanimated/mock`) : tous les tests ont le même faux.
- Tests : 193 tests mobiles (dont 7 pour le loader : nom pour VoiceOver en français et en anglais, message, couleurs
  clair / sombre / `onDark`, étapes de la boucle, animations réduites, un masque SVG par loader).

## Ce que contient le lot M6b

- **L'app parle anglais** quand le téléphone est réglé en anglais (`expo-localization`) ; sinon, en français. Le
  choix de la langue dans Compte arrive au lot M12.
- **Outil** : `i18next` + `react-i18next`. Dans un écran : `const { t } = useTranslation();` puis
  `t('home.searchTitle')`. Les clés sont **typées** (`src/types/i18next.d.ts`) : une faute de frappe dans une clé
  casse `tsc`.
- **Textes dans `common`** (`packages/common/src/i18n/`, import `@afro/common/i18n`) : `fr.ts` (la référence), `en.ts`
  (typé `Translations` : TypeScript refuse une clé oubliée), rangés par écran (`tabs`, `home`, `auth`, `errors`…). Le
  site pourra les reprendre tels quels.
- **Erreurs** : les schémas Zod gardent leurs messages en français (le site les affiche). L'app retrouve la clé du
  message (`errorKeyOf` : « Adresse email invalide » → `errors.emailInvalid`) et la traduit (`useErrorText` →
  `fieldError`). Les erreurs du serveur sont traduites par leur `code` (`apiErrors.email_taken`), avec le message du
  serveur en secours.
- **Prix et notes** : `formatPrice(montant, locale)` (« dès 25 € » / « from €25 ») ; `formatRating` suit la langue
  (« 4,8 » / « 4.8 »). Les catégories sont traduites par leur `slug` (`useCategoryName`) ; les textes écrits par les
  utilisateurs (noms, descriptions) ne le sont pas.
- Tout ce qui était déjà affiché est repris : splash, onglets, Accueil, Recherche, « Bientôt disponible », garde
  « Connecte-toi », tous les écrans de connexion et d'inscription, Compte. Seul l'écran de développement
  « Composants » reste en français.
- Tests : 186 tests mobiles. `i18n.test.ts` (common) : mêmes clés et mêmes `{{variables}}` dans les deux langues,
  chaque message d'erreur des schémas a sa clé, choix de la langue, prix. `english.test.tsx` (mobile) : Accueil en
  anglais (catégories, prix), garde « Sign in », erreurs du formulaire d'inscription et « email déjà pris » en anglais.
  Les autres tests restent en français (`jest.setup.ts` fixe le français avant chaque test).

## Ce que contient le lot M6c

- **Thème sombre**, d'après la maquette section 7 validée par Mouss le 24/11 (« c'est parfait, intègre »).
- **Une seule liste de couleurs, deux thèmes** : `packages/config/tailwind/palette.cjs` construit le thème clair
  (les couleurs du site, `tokens.json` → `color`) et le thème sombre (`tokens.json` → `colorDark`), avec les mêmes
  noms (`primary`, `muted-foreground`…).
- Dans le preset NativeWind, chaque couleur lit une **variable CSS** (`bg-primary` → `rgb(var(--color-primary))`).
  `ThemeRoot` (`src/theme/`, posé dans `AppProviders`) donne aux variables les valeurs du thème actif avec `vars()` de
  NativeWind : tous les écrans changent de couleur sans être réécrits. `global.css` garde les valeurs claires par
  défaut.
- Pour ce qui ne passe pas par `className` (icônes lucide, roues de chargement, fond des écrans) :
  `useThemeColors()` renvoie les couleurs du thème actif. Plus aucune couleur écrite en dur dans les écrans (sauf le
  splash, qui garde son fond terre, et la photo de la bannière).
- Le thème suit le **réglage du téléphone** (`useColorSchemeName`). Le choix « Clair / Sombre / Automatique » est
  prêt dans `themeStore` et aura son écran dans Compte (lot M12).
- Barre d'onglets : verre fumé en sombre (flou `tint="dark"`, onglet actif soleil). Le fondu du splash va vers le
  fond du thème actif.
- Tests : 182 tests mobiles. `preset.test.ts` : thème clair identique au site, chaque couleur lit sa variable,
  thème sombre complet, contrastes AA des textes en sombre. `theme.test.tsx` : suit le téléphone, clair par défaut,
  le choix passe avant le téléphone, couleurs sombres posées autour de l'app.

## Ce que contient le lot M6

- **Accueil de la maquette** (`src/features/home/HomeScreen.tsx`) : bannière photo assombrie
  (`assets/images/banniere-accueil.webp`, la même que la maquette) avec le logo clair et « Des talents qui font vivre
  nos cultures », recherche en pilule à cheval sur la bannière, les 5 catégories principales avec leurs icônes
  (`categoryIcons.ts`, SVG de la maquette), « À la une » en défilement horizontal.
- Toucher la recherche ou « Tout voir » ouvre l'onglet Recherche ; toucher une catégorie l'ouvre filtrée
  (`/recherche?categorie=beaute`, adresse fabriquée par `searchHref`). En attendant le lot M7, la Recherche affiche
  juste le filtre reçu (« Catégorie : Beauté »).
- Nouveaux composants réutilisables : `ProviderCard` (carte prestataire, servira aux résultats de recherche) et
  `QueryState` (chargement → erreur avec « Réessayer » → contenu).
- L'ancien accueil provisoire et ses données de démo sont supprimés. Le lien vers l'écran de travail `/catalogue`
  reste en bas de l'Accueil, seulement en développement (`__DEV__`).
- Pas encore branché : la cloche des notifications et le cœur des favoris de la maquette (pas de fonctionnalité
  derrière pour l'instant), et le toucher d'une carte (profil prestataire au lot M8).
- Tests : 112 tests mobiles. `HomeScreen.test.tsx` : bannière, chargement, catégories principales (sans les
  sous-catégories), cartes « À la une » et prix, erreur puis « Réessayer », catégorie → Recherche filtrée, pilule →
  Recherche.

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
- **Pastille de non-lus** sur Messages (`useClientUnreadCount`, devenu `useUnreadMessages` en M14a) : même requête et même cache que `useUnreadCount` de
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
  - Schémas de formulaire séparés : `profileForms.ts` (dans `packages/common/src/utils/` depuis M15c) ; euros ↔ centimes partagés
    dans `apps/web/src/lib/money.ts` (dans `packages/common/src/utils/money.ts` depuis M14b).
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
    Schéma de formulaire séparé : `packages/common/src/utils/reviewForm.ts` (déplacé en M12a). Après l'envoi, retour sur le profil avec
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
    euros « à la française » (`features/quotes/lib/quoteForm.ts`, dans `packages/common/src/utils/quoteForm.ts` depuis M14b), reprise de la version précédente pour négocier.
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
    (`packages/common/src/utils/quoteRequestForm.ts`, déplacé du site au lot M9) : les champs HTML sont du texte et le budget est en euros ;
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
