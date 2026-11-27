# Règles métier

Les 9 règles de [`conception/2-modele-de-donnees.md`](conception/2-modele-de-donnees.md) (section 8),
et où elles vivent dans `packages/common/src/rules/`. Toutes sont des fonctions pures, testées à côté.

| N°  | Règle                                                                                                                           | Fonction(s)                                                                             | Fichier                  | Statut   |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------ | -------- |
| 1   | Pas de `ProviderProfile` sans le rôle `provider`                                                                                | `canHaveProviderProfile`                                                                | `providerProfile.ts`     | ✅ lot 7 |
| 2   | Envoi en validation seulement si ≥ 1 catégorie, ≥ 3 photos, ≥ 1 formule active, une ville                                       | `getMissingProfileRequirements`, `canSubmitProfileForReview`, `canChangeProviderStatus` | `providerProfile.ts`     | ✅ lot 7 |
| 3   | Pas de demande si le prestataire est indisponible (blocage manuel ou `maxBookingsPerDay` atteint)                               | `isProviderAvailable`                                                                   | `isProviderAvailable.ts` | ✅ lot 0 |
| 4   | Pas de demande à soi-même ; regroupe aussi la n° 3 et les garde-fous (client actif, profil publié, date entre demain et +2 ans) | `canSendQuoteRequest`                                                                   | `quoteRequest.ts`        | ✅ lot 1 |
| 5   | Accepter un devis : autres versions `superseded`, création de la `Booking`, `Unavailability`, message système                   | `canAcceptQuote`, `acceptQuote`                                                         | `acceptQuote.ts`         | ✅ lot 5 |
| 6   | Avis seulement sur une réservation `completed`, une fois, par son client                                                        | `canReviewBooking`                                                                      | `review.ts`              | ✅ lot 6 |
| 7   | Téléphones et emails masqués tant qu'il n'y a pas de réservation confirmée                                                      | `maskContactDetails`, `shouldMaskContactDetails`                                        | `contactMasking.ts`      | ✅ lot 1 |
| 8   | Note moyenne et nombre d'avis recalculés (avis publiés seulement, arrondi à 0,1)                                                | `computeProviderRating`                                                                 | `review.ts`              | ✅ lot 6 |
| 9   | Remboursement selon la politique copiée dans la réservation et les jours restants                                               | `computeCancellationRefund`, `describeCancellationPolicy`, `CANCELLATION_POLICIES`      | `cancellation.ts`        | ✅ lot 1 |

## Autres fonctions métier

| Fonction                                                                                                        | Rôle                                                        | Fichier              |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------- |
| `computePriceFrom`, `minimumOfferingPrice`                                                                      | Prix « à partir de » (par personne × invités minimum)       | `offering.ts`        |
| `computeQuoteTotal`, `computeDepositAmount`, `isQuoteExpired`, `nextQuoteVersion`                               | Calculs de devis                                            | `quote.ts`           |
| `computeQuoteRequestExpiresAt`, `shouldExpireQuoteRequest`, `canChangeQuoteRequestStatus`, `isQuoteRequestOpen` | Cycle de vie des demandes (expiration à 7 jours)            | `quoteRequest.ts`    |
| `isProviderPublic`                                                                                              | Seuls les profils `published` sont visibles et contactables | `providerProfile.ts` |

## Politiques d'annulation (validées par Mouss le 22/11/2026)

| Politique            | 100 % remboursé si annulé au moins… | 50 % si au moins… | Sinon |
| -------------------- | ----------------------------------- | ----------------- | ----- |
| Souple (`flexible`)  | 7 jours avant                       | 2 jours avant     | 0 %   |
| Modérée (`moderate`) | 30 jours avant                      | 14 jours avant    | 0 %   |
| Stricte (`strict`)   | 60 jours avant                      | 30 jours avant    | 0 %   |

Si c'est le prestataire (ou l'admin) qui annule : 100 % remboursé. En mode `offline`, ces chiffres servent
seulement à **afficher** les conditions.

## Masquage des coordonnées (règle n° 7)

Masqués : emails classiques, emails « déguisés » (`at`, `arobase`, `dot`, `point`), et toute suite de
**9 chiffres ou plus** (séparateurs espace, point, tiret, slash ; indicatif `+33`/`0033` accepté).
Les dates (`12/06/2027`), prix et codes postaux ne sont pas touchés. Ce n'est pas infaillible :
le bouton « Signaler » complète le dispositif.

## Précisions ajoutées au lot 4

- **Expiration à 7 jours** : seule une demande `pending` expire. Si le prestataire écrit dans la conversation (une
  question, par exemple), le délai repart pour 7 jours : il est actif, la demande ne doit pas expirer sous ses yeux.
- **Conversation fermée** quand la demande est déclinée, expirée ou annulée : plus d'envoi possible (409).
- **Messages système** (« Demande déclinée… », « Demande annulée… ») : comptés comme non lus des deux côtés, jamais masqués.

## Précisions ajoutées au lot 5

- **Accepter un devis** (`canAcceptQuote`) : seulement le client, sur un devis `sent`, encore valable (`validUntil`),
  demande `quoted`, et si la date est toujours libre. `acceptQuote` est pure : elle calcule la réservation, la date
  bloquée, les versions mises à jour et le message système ; le serveur les enregistre ensemble.
- **Nouvelle version de devis** : la version précédente encore `sent` passe en `superseded`. Le total est toujours
  recalculé côté serveur.
- **Refus d'un devis par le client** : le devis passe en `declined`, la demande reste `quoted` (le prestataire peut
  proposer une nouvelle version).
- **Annulation d'une réservation** : possible jusqu'à la veille, par le client ou le prestataire ; la date est libérée et
  un message système affiche le remboursement prévu sur l'acompte (règle n° 9, mode `offline` : affichage seulement).
- **Fin de prestation** : `confirmed` → `completed` le lendemain de la date (vérifié à chaque lecture, comme l'expiration).

## Précisions ajoutées au lot 6

- **Une seule fonction pour le bouton et le serveur** : `canReviewBooking` décide d'afficher « Laisser un avis » ET
  d'accepter `POST /reviews` (403 si ce n'est pas sa réservation, 409 si pas terminée ou déjà notée).
- **Recalcul de la note** (règle n° 8) à chaque avis créé ; un avis masqué par la modération (lot 8) sortira du calcul.
- **Sous-notes** : facultatives, mais les trois ensemble (le schéma de l'API les attend groupées).
- **Réponse du prestataire** : une seule, publique, non modifiable (409 `already_replied`). Pas de réponse sur un avis masqué.

## Précisions ajoutées au lot 7

- **Devenir prestataire** (règle n° 1) : le serveur crée le profil ET ajoute le rôle `provider` en une seule opération.
  Un deuxième appel renvoie le profil existant.
- **Envoi en validation** (règle n° 2) : `canSubmitProfileForReview` côté serveur (422 `incomplete_profile` avec la
  liste de ce qui manque, 409 si le statut ne le permet pas) ; `getMissingProfileRequirements` affiche la checklist.
- **Pause** : seulement `published` ↔ `paused` (`canChangeProviderStatus`). Un profil en pause sort de la recherche ;
  ses réservations en cours ne changent pas.
- **Adresse publique** (`slug`) : suit le nom commercial tant que le profil est un brouillon, figée ensuite
  (pour ne pas casser les liens déjà partagés).

## Précisions ajoutées au lot 8 (modération)

- **Décisions sur un profil** : seulement depuis `pending_review` (`canChangeProviderStatus`). Corrections et refus
  exigent un motif (10 caractères minimum), copié dans `rejectionReason` et visible par le prestataire.
  Le badge « Pro vérifié » ne s'active que si le profil a un SIRET.
- **Signalements** : un signalement traité ne se retraite pas (409). « Masquer » dépend de la cible (avis masqué,
  message remplacé, photo retirée, profil ou compte suspendu).
- **Suspension** : un compte non `active` ne peut plus se connecter (`currentUser` l'ignore, la connexion de démo
  renvoie 403) et son profil `published` passe en `suspended`.
- **Journal** : toute action d'admin écrit une `ModerationAction`.

## Précisions ajoutées au lot 9 (compte et RGPD)

- **Suppression du compte = anonymisation**, pas effacement des lignes (`DELETE /api/me`) : prénom « Utilisateur »,
  nom « supprimé », email `supprime-<id>@wenzee.invalid`, statut `deleted`, téléphone et photo retirés. Les avis et
  messages restent (l'historique des autres utilisateurs reste cohérent) mais ne désignent plus personne.
- Refusée (409 `upcoming_bookings`) tant qu'il reste une réservation **confirmée à venir**, côté client ou prestataire.
  Un compte admin ne se supprime pas depuis l'application (422).
- Les demandes encore ouvertes (`pending`, `quoted`) sont annulées ; le profil prestataire passe `suspended`,
  sa présentation, son SIRET et ses photos sont effacés.
- L'email ne se modifie pas depuis « Mon compte » au MVP (il servira d'identifiant avec Supabase, lot 10).
- Choix à valider avec le juriste : voir `questions-ouvertes.md` n° 7.

## Planificateur d'événements (27/11/2026)

Fonctions dans `rules/event.ts` (testées dans `event.test.ts`) :

- `computeEventProviderStatus` : le statut d'un prestataire dans un événement n'est **pas stocké**, il vient de
  sa demande de devis : aucune → « Ajouté » ; `pending` → « Devis demandé » ; `quoted` → « Devis reçu » (ou
  « Retenu » si le client l'a retenu) ; `accepted` → « Réservé » ; `declined` / `expired` / `cancelled` → « Sans suite ».
- `computeEventStatus` : « Passé » après la date ; « Devis en cours » si des devis sont demandés et qu'aucun
  prestataire n'est seulement « Ajouté » ; sinon « En préparation ». `countEventProviders` : les 4 indicateurs.
- `canRequestEventQuote` : on demande un devis à un prestataire « Ajouté », ou de nouveau après « Sans suite ».
  L'envoi passe par `canSendQuoteRequest` (règles n° 3 et 4) : chaque refus est rendu au client.
- `canRetainEventProvider` : retenir seulement après un devis reçu (pas déjà accepté). **Retenir n'est pas
  réserver** : aucune réservation, aucune indisponibilité n'est créée.
- `isValidEventDate` : aujourd'hui ou plus tard (une date déjà passée peut rester en modification).
- `toQuoteEventType`, `budgetRangeOf`, `buildEventQuoteMessage` : la demande envoyée (type, fourchette en centimes,
  message de 20 caractères minimum, sinon présentation automatique de l'événement).
- Supprimer un événement est « doux » (`deletedAt`, restaurable) et ne touche pas aux demandes déjà envoyées.
