# Avancement

Dernière mise à jour : 22/11/2026 (lot 2).

## Lots

| Lot    | Sujet                                                                               | État                    | PR  |
| ------ | ----------------------------------------------------------------------------------- | ----------------------- | --- |
| 0      | Socle du monorepo + CI                                                              | ✅ fusionné             | #1  |
| 1      | Cœur partagé : schémas, règles, base mockée, dossier `agents/`                      | ✅ fusionné             | #2  |
| 2      | Design system, layouts, connexion de démo                                           | 🔍 PR ouverte, à relire | #3  |
| 3      | Découvrir : accueil, recherche, catégories, profil                                  | ⏭️ prochain             |     |
| 4      | Demander un devis + messagerie                                                      |                         |     |
| 5      | Devis et réservation → **jalon A** (démo cliquable, s'arrêter pour que Mouss teste) |                         |     |
| 6 – 11 | Avis, onboarding, admin, finitions, Supabase, emails                                |                         |     |

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
- Thème : toujours la palette provisoire (terre cuite, or, vert). L'identité visuelle définitive attend un nom de marque.

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

- Identité visuelle définitive (couleurs, typographie, logo), liée au nom de la marque.
- Nom de la marque (remplacera `@afro/…` au lot 11).

## Écarts assumés par rapport à la conception

- `Notification`, `Payment`, `Dispute`, `Favorite` : pas de schéma au MVP (prévu).
- `Quote.lines` : les lignes sont renvoyées dans le devis (pas de route séparée pour `QuoteLine`).
- `Booking` a en plus `quoteRequestId` et `cancelledAt` (pratique pour les écrans et la règle n° 9).
- `ProviderProfile.postalCode` peut être vide pour un brouillon d'onboarding.
- Page d'accueil : « à la une » = les 8 profils publiés les mieux notés (en attendant la mise en avant payante).
