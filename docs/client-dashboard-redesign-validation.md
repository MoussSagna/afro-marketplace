# Espace client : refonte du tableau de bord et validation visuelle

> Les captures de chaque cycle ont servi à la comparaison mais **ne sont pas versionnées** (règle de Mouss) :
> elles sont dans `docs/screenshots/client-dashboard/` le temps de la relecture, puis supprimées avant la PR.
> Ce document garde les mesures, les écarts relevés et les corrections.

Refonte de l'espace client existant (`/espace/…`, gabarit `ClientLayout`) selon la méthode **coder → capturer →
comparer → corriger → recapturer** (3 cycles maximum, [`agents/conventions.md`](../agents/conventions.md)).
Mêmes routes, mêmes hooks, mêmes données : aucune valeur de la maquette n'est codée en dur.

## 1. Référence

| Élément                   | Valeur                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Maquette                  | Image jointe par Mouss le 27/11/2026 (« Bonjour Aïssatou », non versionnée)              |
| Résolution de comparaison | **1536 × 1024** (taille de la maquette), Chromium (Playwright 1.63), animations réduites |
| Autres formats vérifiés   | Tablette 820 × 1180 (tactile), mobile iPhone 13 (390 × 664, densité 3)                   |
| Compte de test            | Aïssatou (`user-aissatou`), données de démo                                              |
| Design system             | `packages/config/tailwind/theme.css` + `agents/conventions.md` : aucune couleur ajoutée  |

### Analyse de la maquette (avant de coder)

| Zone                   | Mesures relevées sur la maquette (px)                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Conteneur              | x 55 → 1481 (**1426**)                                                                                                                                 |
| Navigation de l'espace | Onglets h ~50, icône + libellé ~18 ; actif : fond terre cuite très léger, texte brun gras ; pastille orange sur Messages ; filet dessous               |
| Bannière               | y 192 → 373 (**181**), coins ~32 ; « Bonjour **Aïssatou** 👋 » ~44 (prénom en rouille) ; photo de réception à droite, fondue ; arcs décoratifs         |
| Chiffres               | 3 cartes **~465 × 118**, écart ~20 ; tuile d'icône 80 × 80 sable ; « 02 » ~40 gras ; libellé ~20 ; chevron                                             |
| En-tête                | « Mes demandes » ~40 ; « + Nouvelle demande » 250 × 54 en pilule brune, à droite                                                                       |
| Filtres                | Pilule 545 × 54 ; actif plein brun                                                                                                                     |
| Cartes de demande      | 1426 × **132** ; photo **116 × 96** arrondie ; nom ~26 gras + badge ; type ~20 ; date, ville, invités ~18 ; statut en pilule à icône ; chevron rond 42 |

### État initial (avant refonte)

Capture `0-initial-*` : conteneur de 1120 px, petits onglets gris (`SpaceNav` « top »), titre « Mes demandes »,
filtres gris compacts, cartes à **avatar rond de 48 px**, pastille de statut minuscule. Pas de bannière, pas de
chiffres, pas de bouton « Nouvelle demande ».

## 2. Ce qui a été fait

| Fichier (`apps/web/src/…`)                                                  | Rôle                                                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `app/layouts/ClientLayout.tsx`                                              | Conteneur 1426 px ; onglets `SpaceNav` « tabs » ; fondu CSS au changement d'onglet             |
| `components/layout/SpaceNav.tsx`                                            | Nouvelle variante `tabs` (les variantes `top` et `side` des espaces pro et admin inchangées)   |
| `features/client-dashboard/components/WelcomeBanner.tsx` (nouveau)          | « Bonjour {prénom de la session} 👋 », photo `hero/celebration.webp` fondue (masque CSS), arcs |
| `features/client-dashboard/components/DashboardStats.tsx` (nouveau)         | 3 cartes-liens (chiffre sur 2 chiffres, squelette pendant le chargement)                       |
| `features/client-dashboard/components/ClientDashboardSummary.tsx` (nouveau) | Calcule les chiffres : demandes `open`, réservations à venir, messages non lus                 |
| `features/quote-requests/pages/RequestsPage.tsx`                            | Résumé client au-dessus ; en-tête + « Nouvelle demande » ; filtres en pilule ; états vides     |
| `features/quote-requests/components/RequestCard.tsx`                        | Grande photo, badge vérifié, infos, statut + chevron ; statut sous les infos sur téléphone     |
| `features/quote-requests/components/RequestStatusBadge.tsx`                 | Taille `lg` avec une icône par statut (lisible sans la couleur)                                |
| `features/bookings/lib/upcomingBookings.ts` (nouveau)                       | « Réservation à venir » : une seule règle pour la page Réservations et le tableau de bord      |
| `app/RootRoute.tsx` (nouveau) + `app/routes.tsx`                            | Retour en haut à chaque nouveau chemin (voir cycle 2 et section 5)                             |
| Réservations, Messages, Mon compte                                          | Harmonisation légère : titre au même style, cartes `rounded-2xl` avec ombre douce              |

## 3. Cycles de comparaison

### Cycle 1 : première intégration

**Conforme** : conteneur **55 → 1481** (identique) ; bannière 1426 × 184 (maquette 181) ; chiffres **462 × 122**
(maquette ~465 × 118) ; cartes de demande 1426 × 130 (maquette 132), photo **116 × 96** (identique) ; filtres
531 × 58 (maquette 545 × 54) ; **0 px** de débordement sur les 3 formats.

**Écarts relevés (par priorité)** :

1. Après la connexion, la page s'ouvrait **défilée de 145 px** (bannière cachée sous la navbar) : la page de
   connexion, plus haute que l'écran, gardait son défilement. Aucune page du site ne remettait le défilement en haut.
2. Chiffres « 02 » en Playfair : chiffres elzéviriens (on lit « o2 ») ; la maquette a des chiffres droits gras.
3. Téléphone : le texte de la bannière passe sur la photo (au milieu des visages), peu lisible.
4. Bannière (ordinateur) : les arcs décoratifs tombent sur les visages de la photo.

### Cycle 2 : corrections 1 à 4

- Route racine `RootRoute` : nouveau **chemin** = page en haut ; changer de filtre (`?onglet=`) garde la position ;
  « retour » : position restaurée par le navigateur. (D'abord fait avec `ScrollRestoration` de React Router, remplacé :
  voir section 5.)
- Chiffres en Inter gras, `tabular-nums`.
- Téléphone : photo réduite à 42 % de la largeur, fondu plus long ; texte limité à 58 %.
- Arcs déplacés dans la zone de transition.

**Bilan** : page en haut à l'arrivée (`scrollY` = 0) ; « 02 » lisible ; bannière lisible sur téléphone.
**Reste** : sur ordinateur, les arcs croisent la fin du sous-titre (« événements. »).

### Cycle 3 : correction finale

- Arcs descendus sous le sous-titre.

**Bilan** : composition, alignements et dimensions conformes à quelques pixels près. Captures finales du tableau
de bord et des pages Réservations, Messages, Mon compte (cohérence demandée par Mouss).

## 4. Résultat final

| Point                  | Résultat                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinateur 1536 × 1024 | Conteneur 1426 ; bannière 1426 × 184 ; chiffres 3 × 462 × 122 ; cartes 1426 × 130, photo 116 × 96                                        |
| Tablette 820           | Bannière 788 × 178 ; 3 chiffres sur une ligne (libellés sur 2 lignes) ; cartes horizontales                                              |
| Téléphone 390          | Onglets défilants ; bannière compacte ; 3 chiffres en colonnes (icône au-dessus) ; statut sous les infos ; **0 px** de débordement       |
| Chiffres               | ✅ calculés (demandes `pending` + `quoted`, réservations confirmées à venir, `useUnreadCount`) ; suivent les données (test d'annulation) |
| Cartes des chiffres    | ✅ liens : `/espace/demandes?onglet=open`, `/espace/reservations`, `/espace/messages`                                                    |
| Filtres                | ✅ `?onglet=` comme avant, compteurs dynamiques, sans rechargement ni saut de page                                                       |
| Nouvelle demande       | ✅ `/recherche` : une demande se fait depuis le profil d'un prestataire (parcours existant)                                              |
| Côté prestataire       | ✅ « Demandes reçues » sans bannière ni chiffres ; même style de cartes et de filtres                                                    |
| États                  | ✅ chargement (squelettes), aucune demande (« Faire une première demande »), filtre vide, erreur                                         |
| Tests                  | Vitest `web` 42 fichiers / 270 tests ; Playwright 148 réussis (desktop + mobile)                                                         |

## 5. Écarts assumés et points non résolus

| Écart                                                   | Pourquoi                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pas de cloche de notifications dans la navbar           | Pas de système de notifications au MVP (`Notification` sans schéma) ; la pastille de Messages reste la notification                                                                                                                                                                                                                                                                                                  |
| « Réservations à venir » au lieu de « Réservations »    | Le chiffre compte les réservations confirmées à venir (comme « À venir » de la page Réservations) : libellé exact                                                                                                                                                                                                                                                                                                    |
| Le chiffre peut différer du filtre « Réservations (n) » | Le filtre compte les demandes acceptées, y compris celles dont l'événement est passé (données de démo : 1 contre 2)                                                                                                                                                                                                                                                                                                  |
| « En attente de réponse » en beige, pas en orange       | Couleurs des statuts déjà définies (`requestStatus.ts`) ; une icône par statut ajoutée. Aucun statut inventé : « Réservée », « Déclinée », « Expirée », « Annulée » restent ceux du modèle (pas de « Terminée » pour une demande)                                                                                                                                                                                    |
| Photo de la bannière : soirée de mariage                | Pas de photo de table dressée dans les assets ; `hero/celebration.webp` a la même ambiance (lumières chaudes)                                                                                                                                                                                                                                                                                                        |
| Photos des cartes                                       | Photos de démo aléatoires (picsum, question n° 19)                                                                                                                                                                                                                                                                                                                                                                   |
| Titres en Playfair Display                              | Design system (h1–h3) ; la maquette utilise une linéale grasse                                                                                                                                                                                                                                                                                                                                                       |
| Retour en haut ajouté pour tout le site (`RootRoute`)   | Défaut existant (toute navigation gardait le défilement). `ScrollRestoration` de React Router, essayé d'abord, appelait aussi `scrollTo(0, 0)` ~400 ms après le **premier chargement** : si on avait déjà défilé (ou un test), on était ramené en haut. C'était la cause de l'échec intermittent du test e2e `user-types`. `RootRoute` ne remonte qu'au changement de chemin, jamais au chargement ni sur « retour » |
| Test Vitest « Recherche plein écran (téléphone) »       | A échoué 1 fois sur 7 exécutions complètes, jamais seul : instabilité déjà décrite dans `test/preloadRoutes.ts`                                                                                                                                                                                                                                                                                                      |
| Test e2e `user-types` (ordinateur)                      | Cause trouvée et corrigée (ligne ci-dessus) ; 2 suites complètes sans échec ensuite                                                                                                                                                                                                                                                                                                                                  |
