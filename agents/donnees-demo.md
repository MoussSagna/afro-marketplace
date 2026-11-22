# Données de démo

Construites par `buildSeed(now)` (`packages/common/src/mocks/seed/`). Dates relatives au jour du lancement.

## Comptes de démo (page de connexion du lot 2)

| Compte                            | id                      | Rôles             | Ce qu'il permet de montrer                                                                                         |
| --------------------------------- | ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Aïssatou Ndiaye, cliente          | `user-aissatou`         | client            | Une demande dans chaque statut, une réservation à venir, un avis à laisser                                         |
| Mamadou Sow, « Saveurs de Dakar » | `user-saveurs-de-dakar` | client + provider | Demandes reçues (en attente, devis envoyé, réservée, annulée), agenda ; il a aussi envoyé une demande comme client |
| Nadia, admin                      | `user-admin`            | client + admin    | Profils à valider, signalements ouverts                                                                            |

Jeton de démo : `demo:<id>` (en-tête `Authorization: Bearer demo:user-aissatou`).

## Contenu

- **26 prestataires** en Île-de-France : 22 publiés, 1 `pending_review` (Kompa Vibes Haïti), 1 `changes_requested`
  (Togo Traiteur Express), 1 `paused` (Atelier Kente), 1 `draft` incomplet (Saveurs du Bénin).
- 18 catégories (5 principales), 14 origines culturelles.
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

## Côté Saveurs de Dakar

Demandes reçues d'Aïssatou (`pending`), Kévin (`pending`), Ibrahim (`quoted`, client pro), Grace (réservation
`confirmed` dans 10 jours, message non lu avec numéro visible), Sophie (réservation `cancelled`).
Dates bloquées à la main : dans 15 et 16 jours. `maxBookingsPerDay = 2`.

## Réinitialiser

- Dans le navigateur, les données sont gardées dans le `localStorage` (clé `afro-marketplace:mock-db:v1`).
  Pour repartir de zéro : `mockDb.reset()` (un bouton arrivera au lot 2) ou vider le localStorage.
- **Si tu changes la forme des données** (schéma), incrémente `DEFAULT_STORAGE_KEY` dans `mocks/db.ts`
  (de toute façon, une sauvegarde invalide est ignorée).
- Dans les tests web, la base est réinitialisée après chaque test.
