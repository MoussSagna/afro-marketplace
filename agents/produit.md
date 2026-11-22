# Le produit

## En une phrase

Une marketplace où l'on trouve des **prestataires afro pour ses événements** (traiteurs, pâtissiers,
danseurs, musiciens, DJ, humoristes, speakers, coiffeuses, maquilleuses, décoratrices, location de tenues…),
et où l'on **demande un devis**. Lancement en **Île-de-France**. Nom de marque pas encore choisi
(le code utilise le préfixe provisoire `@afro/…`).

Concurrence : aucune marketplace multi-catégories de prestataires afro active en France
(la plus proche, AFCOMZ, est au Royaume-Uni).

## Décisions validées par Mouss (22/11/2026)

| Sujet             | Décision                                                                                | Conséquence dans le code                                                                   |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Comptes           | Un seul compte, deux rôles possibles (client + prestataire)                             | `User.roles`, `ProviderProfile` 0 ou 1 par user ; règle n° 4 (pas de demande à soi-même)   |
| Réservation       | **Devis d'abord**, pas de réservation directe au MVP                                    | Chaîne `QuoteRequest` → `Quote` → `Booking` ; `Offering.pricingType = fixed` prépare la V2 |
| Multi-envoi       | Une demande = un seul prestataire                                                       | `QuoteRequest.providerId`                                                                  |
| Paiement          | **Hors plateforme** au début, Stripe Connect ensuite                                    | `Booking.paymentMode = 'offline'` ; pas d'écran de paiement au MVP                         |
| Modèle économique | **Gratuit** pour les prestataires au lancement, puis commission + mise en avant payante | `Booking.commissionRate = 0`, `ProviderProfile.featuredUntil` inutilisé pour l'instant     |
| Coordonnées       | Téléphones et emails **masqués** dans les messages avant réservation                    | Règle n° 7                                                                                 |
| SIRET             | Facultatif, badge « pro vérifié » si contrôlé                                           | `siret?`, `isProVerified`                                                                  |
| Zone              | Île-de-France d'abord                                                                   | Ville + code postal + coordonnées GPS (pas de carte au MVP)                                |

## Stack choisie

- **Web** : React 19, TypeScript, Vite, Tailwind v4, **shadcn/ui**, Motion (ex-Framer Motion), React Router, TanStack Query, Zustand, React Hook Form + Zod
- **Tests** : Vitest (unitaires + fonctionnels avec Testing Library et MSW), Playwright (bout en bout)
- **Mobile (après le MVP)** : Expo + NativeWind + Moti, en réutilisant `packages/common`
- **Back-end** : données mockées avec MSW pendant tout le MVP ; **Supabase** recommandé ensuite (lot 10)

## Périmètre du MVP

Le découpage complet est dans [`conception/4-decoupage-mvp.md`](conception/4-decoupage-mvp.md).
Ce qu'on **ne** construit **pas** au MVP : panier, créneaux, paiement en ligne, revenus, litiges,
abonnements, mise en avant payante, multi-envoi, carte, favoris, statistiques prestataire.

Jalons :

- **A, démo cliquable** (après le lot 5) : chercher → demander un devis → le prestataire répond → accepter. Tout mocké.
- **B, MVP mocké complet** (après le lot 9) : tous les écrans, testés, déployés en prévisualisation.
- **C, bêta réelle** (après le lot 11) : Supabase, vrais comptes, premiers prestataires invités.

## Vocabulaire (français ↔ code)

| Français                        | Code                           |
| ------------------------------- | ------------------------------ |
| Prestataire, profil prestataire | `ProviderProfile` (`provider`) |
| Formule, prestation             | `Offering`                     |
| Demande de devis                | `QuoteRequest`                 |
| Devis, ligne de devis           | `Quote`, `QuoteLine`           |
| Réservation                     | `Booking`                      |
| Date bloquée                    | `Unavailability`               |
| Origine culturelle              | `CulturalOrigin`               |
| Signalement                     | `Report`                       |
| Journal de modération           | `ModerationAction`             |

Les codes d'écran (P1 accueil, C1 formulaire de demande, S4 créer un devis, A2 validation admin…)
viennent de [`conception/1-parcours-utilisateurs.md`](conception/1-parcours-utilisateurs.md).
