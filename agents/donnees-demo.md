# Données de démo

Construites par `buildSeed(now)` (`packages/common/src/mocks/seed/`). Dates relatives au jour du lancement.

## Comptes de démo (page de connexion du lot 2)

| Compte                            | id                      | Rôles             | Ce qu'il permet de montrer                                                                                         |
| --------------------------------- | ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Aïssatou Ndiaye, cliente          | `user-aissatou`         | client            | Une demande dans chaque statut, une réservation à venir, un avis à laisser                                         |
| Mamadou Sow, « Saveurs de Dakar » | `user-saveurs-de-dakar` | client + provider | Demandes reçues (en attente, devis envoyé, réservée, annulée), agenda ; il a aussi envoyé une demande comme client |
| Nadia, admin                      | `user-admin`            | client + admin    | Profils à valider, signalements ouverts                                                                            |

Jeton de démo : `demo:<id>` (en-tête `Authorization: Bearer demo:user-aissatou`).

Connexion par email (lot M5, app mobile) : chaque compte a le mot de passe **`Wenzee2026`** (`DEMO_PASSWORD`, table
`credentials`). Le code de vérification reçu « par email » est **toujours `123456`** (`DEMO_OTP_CODE`) ; aucun email
n'est envoyé. Une inscription crée un vrai compte client dans la base de démo (nom « - » en attendant le lot M12).

## Contenu

- **37 prestataires** en Île-de-France : 33 publiés, 1 `pending_review` (Kompa Vibes Haïti), 1 `changes_requested`
  (Togo Traiteur Express), 1 `paused` (Atelier Kente), 1 `draft` incomplet (Saveurs du Bénin).
- **58 catégories : 8 groupes et 50 sous-catégories** (`mocks/seed/catalogue.ts`), traduites et adaptées à la France
  d'après le méga-menu d'un annuaire américain de prestataires afro (capture envoyée par Mouss le 25/11/2026) :
  Organisation & lieux, Traiteur & boissons, Mode & tenues, Déco & location, Musique & animation, Beauté & soins,
  Photo & vidéo, Services événementiels. Ajouts « France » : food trucks, location de tenues, humour, speakers,
  attache de foulard (gélé, moussor). Les anciens identifiants de sous-catégories (`cat-caterer`, `cat-dj`…) sont
  gardés ; les slugs des groupes ont changé (`nourriture` → `traiteur-boissons`, `spectacle` → `musique-animation`,
  `beaute` → `beaute-soins`, `decoration` → `deco-location` ; `conference` a disparu, les speakers sont dans
  Musique & animation).
- Chaque groupe a au moins un prestataire publié (test `search.test.ts`). 11 prestataires ajoutés le 25/11/2026 pour
  les nouvelles sous-catégories : Jour J by Mariama (wedding planner), Salle Les Baobabs (salle + matériel),
  Bissap Bar (cocktails), Couture Wax Kadiatou, Perles de Saba, Fleurs d'Abidjan, Gélé & Glam, Studio Sankofa
  (photo/vidéo), Selfie Box Ambiance (photobooth), Akwaaba Services (serveurs, sécurité), Prestige Cars Mariage.
  Beaucoup de sous-catégories restent vides (ex. Agences de voyage, Habillage de sol) : la page affiche alors
  « aucun résultat ».
- Photos : `picsum.photos` (images génériques, à remplacer par de vraies photos plus tard).
- Avis : chaque prestataire a un historique de réservations terminées avec avis ; note moyenne recalculée.
- Prestataire « Sur devis » (sans prix) : Awa Diallo, conférencière.

## Scénarios d'Aïssatou

| Prestataire      | Statut      | Détail                                                                                           |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| Saveurs de Dakar | `pending`   | Mariage dans 75 jours                                                                            |
| Compagnie Akwaba | `quoted`    | Devis v1 `superseded`, v2 `sent` ; un message avec un numéro masqué                              |
| DJ Makossa Vibes | `accepted`  | Réservation `confirmed` dans 20 jours ; numéro du DJ visible (après réservation), message non lu |
| Douceurs Créoles | `accepted`  | Réservation `completed` il y a 10 jours, **sans avis**                                           |
| Kinshasa Groove  | `declined`  | Avec motif                                                                                       |
| Fatou Gâteaux    | `expired`   |                                                                                                  |
| Glow by Aminata  | `cancelled` | Annulée par la cliente                                                                           |

## Événements d'Aïssatou (planificateur)

| Événement                                       | Date           | Lieu                          | Prestataires (statut calculé)                                                                                                                               |
| ----------------------------------------------- | -------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mariage de Aïssatou (`evt-mariage-aissatou`)    | dans 75 jours  | Paris 75011, 150 invités      | Saveurs de Dakar (Devis demandé : sa vraie demande en attente), Compagnie Akwaba (Devis reçu : son devis v2), Wax & Wedding Déco et Studio Sankofa (Ajouté) |
| Anniversaire 30 ans (`evt-anniversaire-30-ans`) | dans 178 jours | Saint-Denis 93200, 80 invités | DJ Makossa Vibes, Douceurs Créoles, Selfie Box Ambiance (Ajouté)                                                                                            |

## Côté Saveurs de Dakar

Demandes reçues d'Aïssatou (`pending`), Kévin (`pending`), Ibrahim (`quoted`, client pro), Grace (réservation
`confirmed` dans 10 jours, message non lu avec numéro visible), Sophie (réservation `cancelled`).
Dates bloquées à la main : dans 15 et 16 jours. `maxBookingsPerDay = 2`.

## Réinitialiser

- Dans le navigateur, les données sont gardées dans le `localStorage` (clé `afro-marketplace:mock-db:v2`).
  Pour repartir de zéro : menu du compte → « Réinitialiser les données de démo » (ou vider le localStorage).
- **Si tu changes la forme des données** (schéma) **ou le contenu du seed** (catégories, prestataires), incrémente
  `DEFAULT_STORAGE_KEY` dans `mocks/db.ts` : sinon les navigateurs qui ont déjà une sauvegarde valide gardent
  l'ancien jeu de données (passé en `v2` le 25/11/2026 pour les nouvelles catégories).
- Dans les tests web, la base est réinitialisée après chaque test.
