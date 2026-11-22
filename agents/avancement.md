# Avancement

Dernière mise à jour : 22/11/2026 (lot 1).

## Lots

| Lot    | Sujet                                                                               | État                    | PR                   |
| ------ | ----------------------------------------------------------------------------------- | ----------------------- | -------------------- |
| 0      | Socle du monorepo + CI                                                              | ✅ fusionné             | #1                   |
| 1      | Cœur partagé : schémas, règles, base mockée, dossier `agents/`                      | 🔍 PR ouverte, à relire | voir la PR « Lot 1 » |
| 2      | Design system, layouts, connexion de démo                                           | ⏭️ prochain             |                      |
| 3      | Découvrir : accueil, recherche, catégories, profil                                  |                         |                      |
| 4      | Demander un devis + messagerie                                                      |                         |                      |
| 5      | Devis et réservation → **jalon A** (démo cliquable, s'arrêter pour que Mouss teste) |                         |                      |
| 6 – 11 | Avis, onboarding, admin, finitions, Supabase, emails                                |                         |                      |

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

- **Politiques d'annulation** : les seuils proposés (voir `regles-metier.md`) sont à valider.
- Nom de la marque (remplacera `@afro/…` au lot 11).

## Écarts assumés par rapport à la conception

- `Notification`, `Payment`, `Dispute`, `Favorite` : pas de schéma au MVP (prévu).
- `Quote.lines` : les lignes sont renvoyées dans le devis (pas de route séparée pour `QuoteLine`).
- `Booking` a en plus `quoteRequestId` et `cancelledAt` (pratique pour les écrans et la règle n° 9).
- `ProviderProfile.postalCode` peut être vide pour un brouillon d'onboarding.
- Page d'accueil : « à la une » = les 8 profils publiés les mieux notés (en attendant la mise en avant payante).
