# Règles métier

Les 9 règles de [`conception/2-modele-de-donnees.md`](conception/2-modele-de-donnees.md) (section 8),
et où elles vivent dans `packages/common/src/rules/`. Toutes sont des fonctions pures, testées à côté.

| N°  | Règle                                                                                                                           | Fonction(s)                                                                             | Fichier                  | Statut   |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------ | -------- |
| 1   | Pas de `ProviderProfile` sans le rôle `provider`                                                                                | `canHaveProviderProfile`                                                                | `providerProfile.ts`     | ✅ lot 1 |
| 2   | Envoi en validation seulement si ≥ 1 catégorie, ≥ 3 photos, ≥ 1 formule active, une ville                                       | `getMissingProfileRequirements`, `canSubmitProfileForReview`, `canChangeProviderStatus` | `providerProfile.ts`     | ✅ lot 1 |
| 3   | Pas de demande si le prestataire est indisponible (blocage manuel ou `maxBookingsPerDay` atteint)                               | `isProviderAvailable`                                                                   | `isProviderAvailable.ts` | ✅ lot 0 |
| 4   | Pas de demande à soi-même ; regroupe aussi la n° 3 et les garde-fous (client actif, profil publié, date entre demain et +2 ans) | `canSendQuoteRequest`                                                                   | `quoteRequest.ts`        | ✅ lot 1 |
| 5   | Accepter un devis : autres versions `superseded`, création de la `Booking`, `Unavailability`, message système                   | `canAcceptQuote`, `acceptQuote`                                                         | `acceptQuote.ts`         | ✅ lot 5 |
| 6   | Avis seulement sur une réservation `completed`, une fois, par son client                                                        | `canReviewBooking`                                                                      | `review.ts`              | ✅ lot 1 |
| 7   | Téléphones et emails masqués tant qu'il n'y a pas de réservation confirmée                                                      | `maskContactDetails`, `shouldMaskContactDetails`                                        | `contactMasking.ts`      | ✅ lot 1 |
| 8   | Note moyenne et nombre d'avis recalculés (avis publiés seulement, arrondi à 0,1)                                                | `computeProviderRating`                                                                 | `review.ts`              | ✅ lot 1 |
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
