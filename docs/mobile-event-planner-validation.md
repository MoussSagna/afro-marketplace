# App mobile : planificateur d'événements (onglet Événements)

> **Validation visuelle non faite à ce jour.** Les captures demandées (iPhone 390 × 844, iPhone 430 × 932,
> Android 360 × 800, clair et sombre) n'ont pas pu être prises : Expo Go du simulateur iOS est en 57 alors que
> le projet est en SDK 58, et son installation en 58 depuis cette session a été refusée (à faire par Mouss).
> Les cycles 2 et 3 (capturer → comparer → corriger) restent donc à mener ; ce document le dit plutôt que de
> le cacher. Les captures, une fois prises, iront dans `docs/screenshots/mobile-event-planner/` le temps de la
> relecture, puis seront supprimées avant la PR (règle de Mouss, `agents/conventions.md`).

Reprise du planificateur du site (`apps/web/src/features/events/`, la référence) dans `apps/mobile`, avec la
maquette mobile fournie par Mouss le 27/11/2026 pour la composition. **Aucune nouvelle logique métier** : mêmes
schémas, mêmes règles, mêmes 10 opérations d'API et mêmes hooks que le site (`@afro/common`).

## 1. Correspondance site → app

| Site (`/evenements…`)                  | App (`app/evenements/…`, mêmes adresses) | Écran mobile                         |
| -------------------------------------- | ---------------------------------------- | ------------------------------------ |
| `EventsPage` (liste, état vide)        | `index.tsx`                              | `EventsListScreen` + `EventCard`     |
| `EventFormPage` (création, 3 étapes)   | `nouveau.tsx`                            | `EventFormScreen`                    |
| `EventFormPage` (modification)         | `[eventId]/modifier.tsx`                 | `EditEventScreen` → même formulaire  |
| `EventDetailsPage`                     | `[eventId]/index.tsx`                    | `EventDetailScreen`                  |
| `AddEventProviderPage`                 | `[eventId]/ajouter.tsx`                  | `AddProviderScreen`                  |
| `RequestQuotesPage`                    | `[eventId]/devis.tsx`                    | `RequestQuotesScreen`                |
| `AddToEventButton` (fiche prestataire) | fiche `prestataires/[slug]`              | `AddToEventButton` (panneau du bas)  |
| `ConfirmDialog`, `Toaster`             | —                                        | `ConfirmModal`, `Toaster` (nouveaux) |

« Mes événements » est l'onglet Événements (avec la barre d'onglets). **Les écrans d'un événement (créer,
consulter, modifier, ajouter un prestataire, demander les devis) s'ouvrent par-dessus les onglets, sans la barre**
(demande de Mouss, 28/11/2026) : une pile à la racine, `app/evenements/`. « Retour » ou une suppression ramènent à la
liste (`dismissTo`). Pas de header global ni de logo : chaque écran a son titre et une flèche retour (`EventHeader`) ;
les actions principales sont collées en bas (`EventBottomBar`).

## 2. Logique partagée (rien de dupliqué)

- Utilisés tels quels : `useEvents`, `useEvent`, `useCreateEvent`, `useUpdateEvent`, `useDeleteEvent`,
  `useRestoreEvent`, `useAddEventProvider`, `useRemoveEventProvider`, `useRequestEventQuotes`,
  `useSetEventProviderRetained`, `useProviderSearch` ; règles `canRequestEventQuote` ; statuts calculés par l'API.
- **Déplacé du site vers `@afro/common`** (logique pure, pour ne pas la recopier) : `utils/eventForm.ts`
  (brouillon, `toEventInput`, `validateEventStep`) et `utils/eventPlanning.ts` (`missingGroups`,
  `providerGroupId`). Le site les ré-exporte sous les mêmes noms (`lib/eventDraft.ts`, `eventSteps.ts`,
  `eventDisplay.ts`) : son comportement et ses tests ne changent pas.
- « Demander les devis » crée de **vraies demandes de devis** (une par prestataire), comme sur le site : elles
  apparaissent dans « Mes demandes » et la messagerie. Aucune réservation directe.
- Suppression **douce** : le toast « Événement supprimé » propose « Annuler » (`restoreEvent`).

## 3. Ce qui a été fait (cycle 1)

| Fichier (`apps/mobile/…`)                                                   | Rôle                                                                                                                        |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `app/(tabs)/evenements/_layout.tsx`                                         | Pile du planificateur ; connexion exigée (`SignInRequired`)                                                                 |
| `src/features/events/EventsListScreen.tsx`                                  | Titre, « Créer mon événement », cartes, état vide illustré                                                                  |
| `src/features/events/EventCard.tsx`                                         | Photo du type, nom, statut, date, ville, invités, prestataires, devis                                                       |
| `src/features/events/EventFormScreen.tsx`                                   | 3 étapes (Type, Informations, Détails), Précédent / Suivant, validation par étape                                           |
| `src/features/events/EventStepper.tsx`                                      | Progression (ronds, étapes faites cochées)                                                                                  |
| `src/features/events/EventDetailScreen.tsx`                                 | Couverture + Modifier / Supprimer, infos, compteurs, prestataires par famille, retenir, retirer, « Complète ton événement » |
| `src/features/events/AddProviderScreen.tsx`                                 | Recherche (texte, catégorie, ville), « Ajouter » / « Ajouté »                                                               |
| `src/features/events/RequestQuotesScreen.tsx`                               | Cases à cocher, tout (dé)sélectionner, message, récapitulatif, envoi                                                        |
| `src/features/events/AddToEventButton.tsx`                                  | Fiche prestataire : panneau « Ajouter à un événement » + « Nouvel événement »                                               |
| `src/features/events/eventDisplay.ts`, `EventBadges.tsx`, `EventChrome.tsx` | Icônes, photos et pastilles par statut ; en-tête et barre d'actions                                                         |
| `src/components/ConfirmModal.tsx`, `Toaster.tsx`, `src/stores/toasts.ts`    | Confirmation centrée ; toasts avec action                                                                                   |
| `assets/images/evenements/`                                                 | Photos par type (reprises du site)                                                                                          |

Textes : section `events` de `packages/common/src/i18n/fr.ts` et `en.ts` (rien d'écrit en dur), et traduction des
messages d'erreur du formulaire (`errors.planned…`).

## 4. Écarts assumés avec la maquette et le site

| Écart                                                            | Pourquoi                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Barre du bas : Recherche, Favoris, Événements, Messages, Profil  | Consigne : garder la navigation basse existante (la maquette montre Accueil, Prestataires…) |
| Tutoiement (« Crée ton premier événement »)                      | Toute l'app tutoie (convention des textes) ; la maquette vouvoie                            |
| Champ « Code postal » à l'étape 2                                | Exigé par le schéma partagé (comme sur le site) ; absent de la maquette                     |
| Compteurs (ajoutés, demandés, reçus, retenus) sur le détail      | Présents sur le site ; absents de la maquette                                               |
| Actions « Retenir » / « Voir la demande » sur chaque prestataire | Fonctions du site, conservées                                                               |
| Date choisie dans un calendrier (panneau du bas)                 | Même calendrier que la demande de devis de l'app                                            |
| Photos par type d'événement, pas de photo du client              | Comme le site (pas d'envoi de photo au MVP) ; 3 des 6 photos ne font que 320 px             |

## 5. Tests

- `src/features/events/events.test.tsx` (14) : liste, état vide, connexion exigée ; création complète (erreurs par
  étape, valeurs gardées, création en base) ; détail (infos, groupes, suggestions), retrait avec confirmation,
  suppression + « Annuler » ; « Événement introuvable » ; modification préremplie ; ajout (« Ajouté »,
  préfiltre de catégorie) ; demande de devis (sélection, envoi, vraies demandes) ; fiche prestataire (panneau,
  « Nouvel événement »).
- `packages/common/src/utils/eventForm.test.ts` (6) : validation partagée et familles conseillées.
- Résultats : commun 419, web 328, mobile 347 ; lint, types, format ✅. Un test mobile a échoué **une fois** lors
  d'un passage complet en parallèle (trois paquets en même temps), sans pouvoir être identifié ; trois passages
  suivants sans échec.

## 6. Reste à faire

1. Mettre à jour Expo Go du simulateur (SDK 58), puis cycles 2 et 3 de validation visuelle sur les 3 formats.
2. Relecture de Mouss, puis commit et PR (rien n'est commité).
