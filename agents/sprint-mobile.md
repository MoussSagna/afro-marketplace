# Sprint planning : l'application mobile Wenzee

Rédigé le 23/11/2026. **Statut : proposé, en attente du feu vert de Mouss.** Aucun code mobile n'est écrit avant.

- Maquette de référence (validée « pour le moment » le 23/11/2026) : `/mnt/project-files/maquette-mobile/`
  (`index.html` + `captures/`). Les codes d'écran (P1, C4, S2…) sont ceux de la maquette et de `conception/`.
- Logo et icône : `/mnt/project-files/marque-wenzee/`.
- On reste sur les **données mockées** : le back-end (Supabase) vient **en dernier**, après l'app mobile.

## Les règles du jeu

1. **Une petite PR par lot**, dans l'ordre. Mouss relit et fusionne ; on ne commence le lot suivant qu'après.
2. Chaque lot se termine par quelque chose que Mouss **peut voir sur son téléphone** (avec Expo Go).
3. Chaque PR contient ses tests (unitaires **et** fonctionnels) et met à jour `agents/` (`avancement.md`,
   `questions-ouvertes.md`, et `architecture.md` / `commandes.md` quand ça change).
4. On ne réécrit pas la logique : l'app importe `@afro/common` (schémas Zod, règles métier, client API,
   hooks TanStack Query, données mockées). **Seuls les écrans sont nouveaux.**

## La stack mobile (et pourquoi)

| Outil                              | Rôle                                                             | Pourquoi ce choix                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Expo** (SDK 58)                  | Le cadre de l'app : build, accès au téléphone, mises à jour      | Le plus simple pour un dev React : pas besoin d'Xcode ni d'Android Studio pour commencer, test immédiat avec Expo Go    |
| **Expo Router**                    | La navigation, par fichiers (`app/(client)/messages.tsx`)        | Même logique que les routes du site : un fichier = un écran                                                             |
| **NativeWind**                     | Tailwind pour React Native (`className="bg-primary rounded-xl"`) | Tu gardes tes réflexes Tailwind ; les couleurs viennent des mêmes tokens que le site                                    |
| **Moti** (sur Reanimated)          | Les animations (splash, apparitions, panneaux)                   | L'équivalent mobile de Motion (Framer Motion), avec une syntaxe très proche                                             |
| **jest-expo + Testing Library RN** | Tests unitaires et fonctionnels des écrans                       | Vitest ne sait pas faire tourner React Native ; jest-expo est l'outil officiel. Les tests de `common` restent en Vitest |
| **AsyncStorage**                   | Garder la session et la base mockée entre deux ouvertures        | L'équivalent du `localStorage` du site                                                                                  |

Comment l'app parle aux mocks : sur le site, MSW intercepte les appels réseau dans le navigateur. Sur téléphone,
on fait plus simple : le client API de `common` reçoit une fonction `fetch` qui envoie chaque requête **directement
aux mêmes handlers MSW**, sans réseau. Le jour du back-end, on change seulement cette fonction.

## Vue d'ensemble

| Sprint | Objectif                      | Lots      | À la fin, tu peux…                                                                   |
| ------ | ----------------------------- | --------- | ------------------------------------------------------------------------------------ |
| 0      | Préparer                      | M0        | lire ce plan (cette PR)                                                              |
| 1      | Les fondations                | M1 → M5   | ouvrir l'app, voir le splash, te connecter, naviguer entre les onglets               |
| 2      | Découvrir                     | M6 → M8   | chercher un prestataire, filtrer, ouvrir un profil                                   |
| 3      | Demander un devis et discuter | M9 → M10  | envoyer une demande et échanger des messages                                         |
| 4      | Réserver et donner son avis   | M11 → M12 | accepter un devis, voir ses réservations, laisser un avis → **jalon M1**             |
| 5      | Le mode prestataire           | M13 → M15 | répondre à une demande, envoyer un devis, gérer son agenda et son profil             |
| 6      | Finitions                     | M16       | une app mockée complète, prête pour des tests sur d'autres téléphones → **jalon M2** |

Ensuite seulement : le back-end (Supabase), qui branche la vraie connexion, le vrai stockage des photos et le temps réel,
pour le site **et** l'app en même temps.

---

## Sprint 0 : préparer

### M0 · Ce plan (PR de documentation)

- Ce que Mouss a à faire de son côté (Expo Go, comptes développeur, Supabase…) : la liste à jour est en haut de
  `questions-ouvertes.md`, section « Ce que Mouss a à faire ».

- `agents/sprint-mobile.md` (ce fichier), mise à jour de `avancement.md`, `questions-ouvertes.md` et `README.md`.
- Pas de code.

---

## Sprint 1 : les fondations

### M1 · Le squelette de l'app

- Création de `apps/mobile` (Expo SDK 58, Expo Router, TypeScript strict, ESLint partagé).
- Réglage de Metro (le « Vite » d'Expo) pour le monorepo pnpm, et **un seul React** pour tout le dépôt
  (Expo 58 impose React 19.3.0 alors que le site est en 19.3.1 : on aligne).
- Mise en place de jest-expo + Testing Library ; la CI lance lint, types et tests du mobile.
- Commandes ajoutées à `commandes.md` (`pnpm --filter @afro/mobile start`, etc.).
- **Tu verras** : un écran « Bonjour Wenzee » sur ton téléphone en scannant le QR code avec Expo Go.
- **Tests** : l'écran s'affiche (premier test fonctionnel, pour prouver que l'outillage marche).

### M2 · Le thème et les composants de base

- NativeWind branché sur les tokens de `packages/config/tailwind/tokens.json` (mêmes couleurs, rayons, ombres que le site).
- Polices Playfair Display (titres) et Inter (texte) chargées avec `expo-font`.
- Composants maison, équivalents des composants shadcn du site : `Button` (cta, primary, outline, ghost), `Text` /
  `Heading`, `Input`, `Card`, `Badge`, `Chip`, `Avatar`, `Rating`, `EmptyState`, `Logo` (SVG Wenzee).
- Un écran caché « Catalogue » qui montre tous les composants (pratique pour relire le design).
- **Tests** : chaque variante de bouton, champ avec erreur, note en étoiles (accessibilité incluse).

### M3 · Les données mockées sur téléphone

- Le client API de `common` branché sur les handlers MSW **en mémoire** (voir plus haut), avec la base mockée gardée
  dans AsyncStorage.
- `QueryClient` (TanStack Query) et la session (Zustand + AsyncStorage), comme sur le site.
- Les photos du jeu de démo viennent d'internet (`picsum.photos`) : affichage avec `expo-image` (cache).
- **Tu verras** : la liste des catégories chargée depuis les mocks, et qui survit à la fermeture de l'app.
- **Tests** : unitaires sur le branchement « fetch → handlers », fonctionnel sur un écran qui charge des données
  (chargement, résultat, erreur).

### M4 · Navigation et splash screen

- Les 5 onglets du mode client (Accueil, Recherche, Demandes, Messages, Compte), les icônes, la pastille de non-lus.
- Le **splash animé** de la maquette (section 0) : écran natif Expo statique, puis l'animation du logo Wenzee
  (faite avec Reanimated directement, voir avancement.md) ;
  logo complet directement si « Réduire les animations » est activé.
- Icône de l'app (export PNG de `wenzee-app-icon.svg`).
- Les écrans encore vides affichent « Bientôt disponible (lot Mx) », comme on l'avait fait sur le site.
- Ajout demandé par Mouss le 24/11/2026 : barre d'onglets flottante en verre (façon iPhone) qui se rétracte en un
  rond au défilement (maquette, section 6). Validée le 24/11, intégrée au lot M4 bis.
- **Tests** : on passe d'un onglet à l'autre ; le splash disparaît une fois l'app prête.

### M5 · Connexion et inscription

- Les écrans de la maquette, section 2 : Bienvenue, Inscription, Code OTP, Connexion, Mot de passe oublié,
  Nouveau mot de passe, Compte vérifié, **plus** l'accès aux 3 comptes de démo (P8).
- Comme il n'y a pas encore de back-end, les nouvelles routes (`/api/auth/sign-up`, `verify-otp`, `sign-in`,
  `forgot-password`, `reset-password`) sont **simulées** dans `common` : le code OTP de démo est toujours `123456`
  et aucun email n'est envoyé. Google et Apple affichent « Bientôt disponible ». **Décidé par Mouss le 23/11/2026**
  (voir `questions-ouvertes.md`, « Tranchées »).
- Gardes : les espaces Demandes, Messages et Compte demandent d'être connecté, puis on revient où on était.
- **Tests** : schémas Zod (email, mot de passe, code à 6 chiffres) ; handlers ; fonctionnels sur chaque écran
  (erreurs affichées, code faux, renvoi du code) ; un parcours complet inscription → code → accueil connecté.

---

## Sprint 2 : découvrir

### M6 · Accueil (P1)

> **27/11/2026 : l'onglet Accueil n'existe plus.** Ses sections sont l'état initial de l'onglet Recherche
> (premier onglet, écran d'ouverture) ; « À la une » devient un carrousel plein écran. Voir `avancement.md`.

- Bannière photo, grand titre, recherche en pilule, grille des catégories, « À la une » en défilement horizontal.
- **Tests** : affichage, chargement, toucher une catégorie ouvre la recherche filtrée.

### M6b · Traduction anglaise (i18n) · **fait (voir avancement.md)**

Demande de Mouss du 24/11/2026 : l'app doit pouvoir être traduite en anglais. Plus on le fait tôt, moins il y a de
textes à reprendre (aujourd'hui : splash, onglets, connexion, Accueil).

- **Outil** : `i18next` + `react-i18next` (le standard React, marche aussi sur le site) et `expo-localization` pour
  lire la langue du téléphone. Français par défaut, anglais en second ; si le téléphone est dans une autre langue,
  on reste en français.
- **Textes partagés dans `common`** (`packages/common/src/i18n/`) : un fichier par langue, rangé par écran
  (`auth`, `home`, `tabs`…). Un test vérifie que chaque clé existe dans les deux langues.
- **Messages d'erreur des schémas Zod** (aujourd'hui écrits en français dans `common`) : ils deviennent des clés
  (`errors.emailInvalid`) traduites au moment de l'affichage. Même chose pour les messages renvoyés par les routes
  simulées (le `code` stable existe déjà).
- **Prix et dates** : `formatPrice` et les formats de date prennent la langue (« 25 € » / « €25 »).
- **Données** : les noms des catégories et des origines sont traduits par leur `slug` ; ce qu'écrivent les
  utilisateurs (descriptions, messages, avis) n'est pas traduit.
- On reprend tous les textes déjà affichés dans l'app (lots M1 à M6), puis chaque lot suivant écrit ses textes
  directement en clés. Choix de la langue dans Compte au lot M12 (en attendant : celle du téléphone).
- **Le site** : même fichiers de traduction, mais beaucoup plus de pages à reprendre : lot à part, à placer quand
  Mouss le décide (question n° 13).
- **Tests** : clés complètes dans les deux langues (unitaire) ; Accueil et Inscription affichés en anglais, erreurs
  du formulaire en anglais (fonctionnels).

### M6c · Thème sombre / clair · **maquette validée le 24/11, fait (voir avancement.md)**

Demande de Mouss du 24/11/2026 : un thème sombre en plus du thème clair actuel. Comme pour la barre d'onglets, on
passe **d'abord par la maquette** : Mouss valide les couleurs sombres, puis on code.

1. **Maquette** (`/mnt/project-files/maquette-mobile/`, nouvelle section 7) : les écrans déjà faits en sombre
   (Accueil, Connexion/Inscription, barre d'onglets en verre, un onglet « Connecte-toi ») et la palette sombre
   (fond brun très foncé, cartes un ton plus clair, textes crème, rouille et soleil gardés pour les accents, contrastes
   vérifiés AA).
2. **Code**, une fois la maquette validée :
   - Les couleurs de `packages/config/tailwind/tokens.json` gagnent une valeur sombre. NativeWind les lit en
     variables CSS : `bg-background`, `text-foreground`… changent seuls de valeur, sans réécrire les écrans.
   - Les quelques couleurs écrites en dur (icônes lucide, barre en verre, `#7A1F0E`…) passent par un petit hook
     `useThemeColors()`.
   - Par défaut, l'app suit le réglage du téléphone ; un choix « Clair / Sombre / Automatique » arrive dans Compte
     (lot M12), gardé dans AsyncStorage.
   - Barre d'onglets : verre sombre (`tint="dark"`). Le splash reste tel quel (déjà sur fond terre).
   - **Tests** : chaque couleur a sa valeur sombre (unitaire, comme le test du preset) ; un écran rendu en sombre
     utilise bien les classes sombres (fonctionnel).
3. **Le site** : mêmes couleurs, la mécanique Tailwind `dark:` existe déjà côté shadcn : lot à part si Mouss le veut
   (question n° 14).

### M6d · Loader Wenzee · **demandé et validé le 24/11 (maquette section 9), fait (voir avancement.md)**

Demande de Mouss du 24/11/2026 : un loader qui reprend le logo animé du splash. Composant `WenzeeLoader`, en boucle,
clair / sombre, « Réduire les animations » respecté ; il remplace les roues grises.

### M7 · Recherche et filtres (P2) · **façon Airbnb, maquette section 8 validée le 24/11, fait (voir avancement.md)**

Demande de Mouss du 24/11 : « une recherche comme sur l'application Airbnb ». On reprend les usages, pas l'identité :
pilule en haut qui s'ouvre en plein écran avec des étapes repliables (Quoi ? → Où ? → Quand ? → Combien
d'invités ?), rangée de catégories à icônes soulignée, grandes cartes photo à faire glisser avec cœur, filtres en
plein écran (tri, budget avec histogramme et curseur à deux poignées, note, origines, vérifiés). Le plan d'origine
ci-dessous reste valable (filtres dans l'adresse, nombre de résultats en direct, « Aucun résultat »).

- Résumé de la recherche en haut, filtres rapides en pastilles, cartes prestataires, chargement de la page suivante
  en défilant, tri.
- Panneau de filtres qui monte du bas (catégorie, origines, date, invités, budget, note, vérifié) avec le nombre
  de résultats en direct. État « Aucun résultat ».
- Les filtres sont gardés dans l'adresse de l'écran (comme `?categorie=` sur le site) : le bouton retour les retrouve.
- **Tests** : conversion filtres ↔ paramètres (unitaire), chaque filtre change les résultats (fonctionnel).

### M8 · Profil prestataire (P5) · **fait (voir avancement.md)**

- Galerie qu'on fait glisser + visionneuse plein écran, badges, note, onglets Formules / Avis / Dispos / Infos,
  calendrier des disponibilités, bouton « Demander un devis » toujours visible en bas, signalement.
- **Tests** : chaque onglet, profil introuvable, bouton devis qui demande la connexion si besoin.

---

## Sprint 3 : demander un devis et discuter

### M9 · Demande de devis (C1) · **fait (voir avancement.md)**

- Formulaire en 3 étapes (Formule → Événement → Message), barre de progression, vérification de la date
  (règle n° 3), écran « Demande envoyée ».
- **Tests** : schéma de saisie (unitaire), date indisponible refusée, envoi qui ouvre la conversation.

### M10 · Mes demandes et messagerie (C2, C4) · **fait (voir avancement.md)**

- Mes demandes en 3 onglets avec leurs badges d'état ; détail d'une demande (annuler, poser une question).
- Liste des conversations, fil de messages avec le devis affiché dans le fil, coordonnées masquées (règle n° 7),
  champ de saisie collé au clavier, rafraîchissement toutes les 7 s (comme le site, en attendant le temps réel),
  pastille de non-lus sur l'onglet.
- **Tests** : envoi d'un message, masquage d'un numéro, conversation fermée, liste vide.

---

## Sprint 4 : réserver et donner son avis → jalon M1

### M11 · Devis et réservations (C3, C5) · **fait (voir avancement.md)**

- Accepter un devis dans un panneau du bas (adresse, conditions d'annulation, case à cocher, règle n° 5) ou le refuser.
- Réservations à venir / passées, adresse et téléphone révélés, annulation avec le remboursement prévu affiché.
- **Tests** : accepter crée la réservation ; annulation selon la politique ; bouton « Laisser un avis » au bon moment.

### M12 · Avis et compte (C6, C8) · **fait en deux PR : M12a avis, M12b compte (voir avancement.md)**

- Laisser un avis (grandes étoiles, sous-notes « les trois ou aucune », commentaire).
- Compte : informations, notifications, aide et FAQ, pages légales, « Réinitialiser les données de démo »,
  déconnexion, suppression du compte, encart « Devenir pro » (qui renvoie vers le site pour l'onboarding).
- **Tests** : règle n° 6, moyenne mise à jour, modification du compte, suppression confirmée.

**Jalon M1** : tout le parcours client fonctionne sur téléphone. On s'arrête pour que tu testes.

---

## Sprint 5 : le mode prestataire

### M13 · Bascule pro et tableau de bord (S2) · fait

- Bascule client ↔ pro depuis le compte, barre d'onglets brune (Tableau, Demandes, Messages, Agenda, Profil).
- Tableau de bord : les 3 chiffres, les demandes à traiter (badge rouge avant expiration), les prochaines dates.
- **Tests** : bascule réservée aux prestataires, chiffres affichés.

### M14 · Demandes reçues et devis (S3, S4, S5)

Découpé en deux PR : **M14a** (demandes reçues, décliner, messagerie pro) · fait ; **M14b** (envoyer un devis) · fait.

- Liste et détail des demandes reçues (disponibilité vérifiée), décliner avec un motif.
- Envoyer un devis : lignes ajoutées une à une, total et acompte calculés en direct, reprise de la version
  précédente pour négocier. Messagerie côté pro (mêmes écrans que C4).
- **Tests** : calcul du total et de l'acompte (unitaire), envoi d'un devis vu côté client (fonctionnel).

### M15 · Agenda et profil pro (S6, S7)

Découpé en PR : **M15a** (agenda) · fait ; **M15b** (profil pro, avis reçus, pause) · fait ; **M15c** (modifier les
sections du profil dans l'app, sauf les photos qui restent sur le site) · fait.

- Agenda du mois : réservé / bloqué / libre, toucher un jour pour le bloquer, réglage « max par jour ».
- Mon profil : aperçu de la carte, sections modifiables, avis reçus avec réponse, pause du profil.
  L'onboarding complet en 7 étapes (S1) reste sur le site.
- **Tests** : bloquer / débloquer un jour, répondre à un avis, mettre en pause.

---

## Sprint 6 : finitions → jalon M2

### M16 · Qualité et préparation des tests sur téléphones

Fait en version économe (parcours de bout en bout + `eas.json`) ; Moti, hors ligne et passe d'accessibilité reportés.
Voir `avancement.md`.

- Parcours de bout en bout (les parcours clés de l'étape 3, version mobile) : voir `questions-ouvertes.md`
  pour l'outil (Maestro ou tests de parcours Testing Library).
- Accessibilité (VoiceOver / TalkBack : libellés, tailles de cible, contrastes), animations d'apparition Moti,
  états hors ligne.
- Configuration EAS (le service de build d'Expo) pour un build de test installable, sans publication sur les stores.
- **Jalon M2** : l'app mockée est complète. Prochaine étape : le back-end.

---

## Ce qui reste hors de l'app (pour l'instant)

- L'**admin** (validation des profils, signalements, utilisateurs) : sur le site.
- L'**onboarding prestataire** en 7 étapes (S1) : sur le site, plus confortable sur grand écran.
- Les **notifications push**, la **connexion Google / Apple** et les **vrais emails** (code OTP) : avec le back-end.
- La publication sur l'App Store et le Play Store : après le back-end.
