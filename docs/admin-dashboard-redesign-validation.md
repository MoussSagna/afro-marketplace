# Back-office admin : refonte du tableau de bord et validation visuelle

> Les captures de chaque cycle ont servi à la comparaison mais **ne sont pas versionnées** (règle de Mouss) :
> elles sont dans `docs/screenshots/admin-dashboard/` le temps de la relecture, puis supprimées avant la PR.
> Ce document garde les mesures, les écarts relevés et les corrections.

Refonte du back-office existant (`/admin/…`, gabarit `AdminLayout`) selon la méthode **coder → capturer →
comparer → corriger → recapturer** (3 cycles maximum, [`agents/conventions.md`](../agents/conventions.md)).
Mêmes routes, mêmes gardes (`RequireAuth role="admin"`), mêmes actions d'admin ; aucune valeur de la maquette
n'est codée en dur.

## 1. Référence

| Élément                   | Valeur                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Maquette                  | Image jointe par Mouss le 27/11/2026 (« Vue d'ensemble », non versionnée)                |
| Résolution de comparaison | **1568 × 1003** (taille de la maquette), Chromium (Playwright 1.63), animations réduites |
| Autres formats vérifiés   | Tablette 834 × 1112, mobile 390 × 844 ; e2e : Desktop Chrome et Pixel 7                  |
| Compte de test            | Nadia, admin (`user-admin`), données de démo (seed neuf à chaque capture)                |
| Design system             | `packages/config/tailwind/theme.css` + `agents/conventions.md` : aucune couleur ajoutée  |
| Script de capture         | Playwright, connexion par le bouton de démo « Admin », 5 pages × 3 formats (hors dépôt)  |

### Analyse de la maquette (avant de coder)

| Zone           | Mesures relevées sur la maquette (px)                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| En-tête        | Brun, h **74** ; logo ~170 de large ; badge « Back office admin » en pilule ; cloche + point jaune ; filet vertical ; avatar 44 + « Admin » |
| Menu latéral   | Largeur **297**, filet à droite ; entrées h 58, pas de 63, icône ~28, libellé ~20 ; actif : fond terre cuite très léger, texte terre        |
| Contenu        | x 338 → 1545 (marges 41 / 23) ; titre Playfair ~46 à y 115 ; sous-titre ~20                                                                 |
| Chiffres       | 4 cartes **288 × 120** à y 218, écart ~20 ; rond jaune 60 ; chiffre ~40 extra-gras ; libellé ~18 sur une ligne                              |
| Deux colonnes  | y 375 → 750 ; « À traiter » 632 de large, « Activité » 546 (≈ 1,16 : 1), écart 32 ; en-tête de carte ~100 avec filet ; 3 lignes de ~86      |
| Ligne de tâche | Tuile d'icône 52 sable ; titre + description ; pilule (« À valider » jaune, « À traiter » terre cuite) ; bouton terre « Examiner › »        |
| Accès rapides  | y 793 → 912 ; titre à gauche (éclair ocre) ; 3 boutons blancs bordés h 62, largeurs selon le libellé, chevron                               |
| Pied de page   | Aucun : le menu latéral descend jusqu'en bas                                                                                                |

### État initial (avant refonte)

Capture `0-initial-*` : la navbar du site **avec ses liens publics** (Accueil, Prestataires…), badge « Admin »,
petit menu latéral gris (`SpaceNav` « side »), 4 tuiles en **2 × 2** sans sous-titre, puis le grand pied de page
du site. Pas de tâches prioritaires, pas d'activité, pas d'accès rapides. Pages secondaires : tableaux simples
(défilement horizontal sur téléphone), filtres en boutons, aucun message après une action.

## 2. Ce qui a été fait

- **Gabarit** (`app/layouts/AdminLayout.tsx`) : la navbar unique en mode `appShell` (nouveau : sans liens du
  site, sans animation de défilement, logo officiel `Logo`), badge « Back office admin », cloche
  (`AdminNotifications`), filet, menu du compte libellé « Admin ». Menu latéral fixe 296 px dès 1024 px
  (`SpaceNav` variante `sidebar`), tiroir ouvert par ☰ en dessous. Pas de pied de page.
- **Vue d'ensemble** (`AdminOverviewPage`) : `AdminPageHeader`, `AdminStatsGrid` (4 liens chiffrés,
  `useAdminOverview`), `AdminPriorityTasks` (profils `pending_review` + signalements ouverts, les plus anciens
  d'abord, 4 au plus), `AdminRecentActivity` (3 derniers événements), `AdminQuickActions`.
- **Activité récente** : nouvelle opération en lecture seule `GET /api/admin/activity` (`getAdminActivity`,
  `useAdminActivity`) reconstruite depuis les tables existantes (comptes, profils, envois en validation,
  signalements, journal de modération). Rien d'inventé ; temps écoulé avec `formatTimeAgo`.
- **Pages secondaires** : `AdminTable` devient une liste de cartes sous 768 px (un seul tableau HTML) ;
  Profils à valider (vignette, catégories, localisation, date, statut, « Examiner ») ; fiche en 2 colonnes
  (décision collante, visionneuse photo `PhotoLightbox`, historique) ; Signalements (icône par type, filtres en
  segments, ancre `#rep-…`) ; Utilisateurs (avatar, type de compte, carte sur téléphone, état « aucun compte »).
- **Retours après action** : message vert (`AdminFeedback`) après validation / corrections / refus (sur la liste),
  après chaque traitement de signalement et chaque suspension / réactivation. Les erreurs restaient déjà affichées.

## 3. Cycles de comparaison

### Cycle 1 : première intégration

Capture `1-cycle1-*` à 1568 × 1003. Structure conforme ; écarts relevés :

| #   | Écart                                                                                                | Priorité |
| --- | ---------------------------------------------------------------------------------------------------- | -------- |
| 1   | Libellés des chiffres sur 2 lignes (« signalements à traiter ») : cartes de **145** px (cible 120)   | Haute    |
| 2   | Accès rapides : libellés sur 2 lignes (maquette : une ligne, largeurs selon le texte)                | Haute    |
| 3   | Logo (36 px), badge (14 px), cloche (24 px), avatar (32 px) et « Admin » plus petits que la maquette | Moyenne  |
| 4   | Menu latéral : libellés 18 px et icônes 24 px (maquette ~20 et ~28)                                  | Moyenne  |
| 5   | « À traiter » (3 lignes) plus courte qu'« Activité » (4 lignes) : vide en bas de la colonne          | Moyenne  |
| 6   | Chiffres à y 230 (maquette 218)                                                                      | Basse    |
| 7   | Tablette : accès rapides en 3 colonnes trop étroites (libellés coupés)                               | Moyenne  |
| 8   | Fiche : règles d'annulation collées sans ponctuation                                                 | Basse    |

Téléphone et tablette : aucun débordement horizontal ; tableaux en cartes lisibles.

### Cycle 2 : corrections 1 à 8

1. Carte : marges 20, écart 16, rond 56, libellé 16 px (17 px dès 1536) → une ligne, cartes de **117** px.
2. Accès rapides dès 1536 px : titre à gauche, boutons en `flex-auto` et libellés sans retour à la ligne.
3. `appShell` : logo 40 px, badge 15 px ; cloche 28 px ; avatar 44 px sur fond ivoire, « Admin » 18 px + chevron.
4. Variante `sidebar` : libellés 19 px, icônes 28 px.
5. Activité limitée à **3** événements, comme la maquette (les deux colonnes ont la même hauteur avec le seed).
6. Écart titre → chiffres 24 px : chiffres à y 226.
7. Accès rapides empilés sous 1024 px.
8. Une règle d'annulation par ligne.

Mesures après correction : chiffres y 226 → 343 (maquette 218 → 337), colonnes y 385 → 743 (375 → 750),
accès rapides y 785 → 896 (793 → 912), contenu x 336 → 1543 (338 → 1545).

### Cycle 3 : validation finale

Capture `3-final-*` des 5 pages × 3 formats : corrections confirmées, aucun débordement, aucune régression
repérée. Pas de 4ᵉ cycle (règle des 3 cycles) ; les écarts restants sont listés ci-dessous.

## 4. Résultat final

- Ordinateur : en-tête, menu latéral, 4 chiffres sur une ligne, 2 colonnes, accès rapides sur une ligne.
- Tablette : tiroir, chiffres 2 × 2, sections empilées, tâches sur une ligne, accès rapides empilés.
- Téléphone : en-tête compact (☰, logo, cloche, avatar), chiffres 2 × 2, tâches avec pilule et bouton
  sous le texte, tableaux en cartes.
- Tests : Vitest (`formatTimeAgo`, handler `admin/activity`, `priorityTasks`, `activityDisplay`,
  `AdminPages.test.tsx` : 25 tests d'écran) ; Playwright `e2e/admin-dashboard.spec.ts` (desktop + mobile).

## 5. Écarts assumés et points non résolus

- **Nom « Admin »** dans l'en-tête (demandé) ; l'avatar garde les initiales du vrai compte (« NA » pour Nadia
  Admin) et non « AD ».
- **Notifications** : pas de notifications enregistrées en base. La cloche montre ce qui reste à traiter
  (mêmes chiffres que la vue d'ensemble) ; la pastille signifie « il reste quelque chose », pas « non lu »
  (question ouverte n° 26).
- **Pas de pied de page** dans le back-office (comme la maquette), alors que les 3 autres gabarits l'ont.
- **Priorité** : pas de niveau de priorité en base ; les tâches sont triées par ancienneté.
- **Utilisateurs** : pas de filtres (l'API ne filtre que par texte ; filtrer une page de 20 côté écran serait
  faux) ni de fiche détaillée d'un compte (aucun écran ni route existants) : question ouverte n° 26.
- **Validation d'un profil** sans fenêtre de confirmation (comportement existant gardé) ; refus, corrections et
  suspension gardent leur fenêtre avec motif.
- Icône « À traiter en priorité » : `Goal` de lucide (cible + drapeau), la plus proche de la cible fléchée.
- Description des tâches : nom et ville du profil, ou motif + contenu signalé (plus utile que la phrase
  générique de la maquette).
- Captures « pleine page » : le menu latéral collant s'arrête à la hauteur de l'écran (effet de la capture ; en
  navigation réelle il reste fixé).
