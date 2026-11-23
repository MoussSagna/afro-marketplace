# Avancement

Dernière mise à jour : 23/11/2026 (lot M1 : squelette de l'app mobile).

## Lots

| Lot     | Sujet                                                                               | État        | PR  |
| ------- | ----------------------------------------------------------------------------------- | ----------- | --- |
| 0       | Socle du monorepo + CI                                                              | ✅ fusionné | #1  |
| 1       | Cœur partagé : schémas, règles, base mockée, dossier `agents/`                      | ✅ fusionné | #2  |
| 2       | Design system, layouts, connexion de démo                                           | ✅ fusionné | #3  |
| 3       | Découvrir : accueil, recherche, catégories, profil                                  | ✅ fusionné | #4  |
| 4       | Demander un devis + messagerie                                                      | ✅ fusionné | #5  |
| 5       | Devis et réservation → **jalon A** (démo cliquable, s'arrêter pour que Mouss teste) | ✅ fusionné | #6  |
| 6       | Avis : laisser un avis (C6), avis reçus (S8)                                        | ✅ fusionné | #7  |
| 7       | Devenir prestataire (P6), onboarding en étapes (S1), modifier mon profil (S7)       | ✅ fusionné | #8  |
| 8       | Admin minimal : profils à valider, signalements, utilisateurs                       | ✅ fusionné | #9  |
| 9       | Mon compte (C8), pages de contenu (P7), SEO, accessibilité → **jalon B**            | ✅ fusionné | #10 |
| 10 – 11 | Supabase, emails + bêta → jalon C                                                   |             |     |

## Application mobile (en préparation)

Ordre voulu par Mouss : site mocké (fait) → **app mobile** → back-end Supabase en dernier.

- Maquette mobile validée « pour le moment » le 23/11/2026 : `/mnt/project-files/maquette-mobile/`.
- Plan en 7 sprints et 16 petits lots (M0 → M16), une PR par lot : [`sprint-mobile.md`](sprint-mobile.md).
  Plan fusionné (#15). « Go M1 » donné par Mouss le 23/11/2026.

| Lot | Sujet                                  | État                    |
| --- | -------------------------------------- | ----------------------- |
| M0  | Sprint planning                        | ✅ fusionné #15 (+ #16) |
| M1  | Squelette Expo + monorepo + tests + CI | 🔍 PR ouverte           |
| M2  | Thème NativeWind + composants de base  | à faire                 |

## Ce que contient le lot M1

- `apps/mobile` (`@afro/mobile`) : Expo SDK 58, Expo Router (`app/_layout.tsx`, `app/index.tsx`), TypeScript strict
  (config `react.json` partagée), ESLint partagé, nom « Wenzee » et identifiant `app.wenzee.mobile` dans `app.json`.
- Écran de bienvenue provisoire (`src/features/welcome/WelcomeScreen.tsx`) : il affiche un prix formaté par
  `@afro/common` pour prouver que le code partagé est bien branché. Couleurs provisoires dans `src/theme.ts`
  (remplacées par NativeWind au lot M2).
- **Un seul React** dans le dépôt : Expo 58 exige React 19.3.0 exactement. `pnpm-workspace.yaml` force
  `react` et `react-dom` en 19.3.0 (`overrides`) : le site passe de 19.3.1 à 19.3.0 (correctif mineur, tous les
  tests restent verts). En plus, `metro.config.js` résout toujours `react`, `react-native` et
  `@tanstack/react-query` depuis `apps/mobile`. Vérifié sur le bundle iOS : une seule copie de chacun.
- Tests : jest-expo + Testing Library React Native (`jest.config.js`, `jest.setup.ts`) ;
  `WelcomeScreen.test.tsx` (titre, prix formaté par `common`, route « / » avec `renderRouter`).
- La CI lance déjà `lint`, `typecheck` et `test` de tous les paquets : le mobile y est inclus sans changement.

## Changement de marque : Wenzee (23/11/2026)

Mouss a choisi le nom **Wenzee** (fin du nom provisoire « Teranga ») et le logo **piste 3 « Le lien »** : deux rubans
imbriqués qui forment un W, un losange au-dessus. Les SVG sont dans `/mnt/project-files/marque-wenzee/`. Les couleurs
du thème ne changent pas. Mouss veut le changement **étape par étape**, une petite PR à la fois :

| Étape | Contenu                                                                             | État   |
| ----- | ----------------------------------------------------------------------------------- | ------ |
| 1     | Le nom : textes, titres des pages, SEO, emails provisoires (`wenzee.example`), docs | ✅ #12 |
| 2     | Le logo : en-tête, pied de page, favicon ; suppression de `teranga-icon.svg`        | ✅ #13 |

Le préfixe des paquets `@afro/…` ne bouge pas pour l'instant (voir `questions-ouvertes.md`).

Étape 2 : composant `Logo` (`apps/web/src/components/Logo.tsx`, image `public/wenzee-logo.svg`) dans l'en-tête
(lien « Wenzee, accueil ») et le pied de page public ; favicon `public/wenzee-icon.svg`. Tests : `Brand.test.tsx`
et une vérification du logo dans `e2e/discover.spec.ts`.

## Jalon A atteint (fin du lot 5)

La boucle complète est cliquable : recherche → profil → demande → messagerie → devis → acceptation → réservation →
agenda. Mouss a demandé de continuer (« passe à la suite ») : on enchaîne les lots suivants, une PR par lot.

## Jalon B atteint (fin du lot 9)

Tous les écrans du MVP existent (plus aucune page « Bientôt disponible »), testés, avec une préview Vercel par PR.
Les 8 parcours Playwright de l'étape 3 passent sur ordinateur et sur mobile, plus la page compte et l'audit
d'accessibilité : 50 tests Playwright verts. Prochaine étape : **l'application mobile** (décision de Mouss le 22/11/2026, avant le back-end) ; le lot 10
(Supabase) est reporté à après.

## Ce que contient le lot 9

- Handlers (`mocks/handlers/auth.ts`) : `PATCH /api/me` (nom, téléphone, préférences ; un téléphone vide le retire)
  et `DELETE /api/me` (anonymisation RGPD, voir `regles-metier.md`). Hooks `useUpdateMe`, `useDeleteMe`.
- Web `features/account/` : **C8 « Mon compte »** (`/espace/compte`) : informations, tableau des notifications
  (sujet × canal), suppression du compte confirmée en tapant « SUPPRIMER ». Après la suppression, on passe par
  `/deconnexion` (qui transmet un message à l'accueil : « Ton compte a bien été supprimé »). Lien « Mon compte »
  ajouté au menu du compte.
- Web `features/static/` : **P7** `/comment-ca-marche`, `/faq` (accordéon `<details>`), `/cgu`, `/mentions-legales`,
  `/confidentialite`, gabarit `StaticPage`. Les textes juridiques sont **provisoires** et l'affichent
  (voir `questions-ouvertes.md` n° 6). Liens dans le pied de page public.
- `soon()` et `PlaceholderPage` supprimés : toutes les routes du MVP pointent vers une vraie page.
- **SEO** (`src/lib/seo.ts`, fonctions pures testées) :
  - `sitemap.xml` et `robots.txt` générés au build par un petit plugin Vite (`vite.config.ts`). Le plan du site vient
    du seed (pages fixes, catégories, profils publiés) ; il viendra de Supabase au lot 10.
  - Adresse du site : `SITE_URL`, sinon le domaine de production Vercel. Seule la production
    (`VERCEL_ENV=production`) est indexable : une préview répond `Disallow: /`.
  - Données structurées JSON-LD (`LocalBusiness` : ville, prix « à partir de », note si avis) sur chaque profil.
- **Accessibilité** : audit axe-core (`e2e/a11y.spec.ts`, WCAG 2.1 AA, zéro violation « serious »/« critical ») sur
  l'accueil, la recherche, un profil, la connexion, la FAQ, « Devenir prestataire » et l'espace client. Corrigé :
  les blocs « Chargement » ont `role="status"` (un `aria-label` sur une `div` sans rôle est interdit), et les jours
  passés des calendriers ont un contraste suffisant.
- Tests : `me.test.ts` (handlers), `accountForm.test.ts`, `AccountPage.test.tsx`, `StaticPages.test.tsx`,
  `seo.test.ts` ; Playwright `account.spec.ts` (compte, pied de page, JSON-LD) et `a11y.spec.ts`.

## Ce que contient le lot 8

- Handlers (`mocks/handlers/admin.ts`, réservés au rôle `admin`, 401/403 sinon) :
  `GET /api/admin/overview`, `GET /api/admin/providers/to-review`, `GET /api/admin/providers/:id` (fiche + propriétaire
  - historique), `POST /api/admin/providers/:id/moderate` (valider / corrections / refus avec motif),
    `GET /api/admin/reports?status=` (avec un aperçu de la cible), `POST /api/admin/reports/:id/resolve`
    (classer, masquer le contenu, suspendre l'auteur), `GET /api/admin/users?q=&page=` (recherche sans accents),
    `POST /api/admin/users/:id/status` (suspendre, bannir, réactiver, motif obligatoire).
- **Journal** : chaque décision écrit une `ModerationAction` (qui, quoi, motif).
- Effets : masquer un avis le passe en `hidden` et recalcule la note (règle n° 8) ; masquer un message remplace son
  texte ; masquer une photo la retire ; suspendre un compte bloque la connexion et sort son profil de la recherche
  (`published → suspended`), réactiver le remet en ligne. Un admin ne peut pas être suspendu.
- Vues : `adminOverviewSchema`, `adminProviderDetailsSchema`, `adminReportSchema` ; libellés `USER_ROLE_LABELS`,
  `USER_STATUS_LABELS`, `REPORT_STATUS_LABELS`, `MODERATION_ACTION_LABELS`. Hooks : `queries/useAdmin.ts`.
- Web (`features/admin/`) : A1 `/admin` (4 chiffres), A2 `/admin/prestataires` et la fiche `/admin/prestataires/:id`,
  A3 `/admin/signalements` (filtre par statut), A4 `/admin/utilisateurs` (recherche, pagination, suspension).
  Fenêtre à motif réutilisable : `ReasonDialog`. Tableaux simples (`AdminTable`), pas d'effort de design (prévu).
- Playwright : `e2e/admin.spec.ts` (parcours 6 : l'admin valide un profil, qui apparaît dans la recherche).

## Ce que contient le lot 7

- Handlers (`mocks/handlers/myProvider.ts`, qui reprend aussi `GET/PATCH /api/me/provider` du lot 5) :
  `POST /api/me/provider` (crée un brouillon et ajoute le rôle `provider`, règle n° 1), `PATCH /api/me/provider`
  (l'adresse `slug` suit le nom tant que le profil est un brouillon), `POST /api/me/provider/submit` (règle n° 2, 422 si
  incomplet), `POST /api/me/provider/pause`, formules (`POST/PUT/DELETE /api/me/provider/offerings`, le « à partir de »
  est recalculé avec `computePriceFrom`), galerie (`POST/DELETE /api/me/provider/media`, la 1re photo devient la couverture).
- `utils/slugify.ts` (`slugify`, `uniqueSlug`) ; libellés `PROVIDER_STATUS_LABELS`, `PRICING_TYPE_LABELS`, `LANGUAGE_LABELS` exporté.
- Hooks (`queries/useMyProvider.ts`, qui reprend `useMyProviderProfile` et `useUpdateMyProviderProfile`) :
  `useStartProviderOnboarding`, `useSubmitMyProviderProfile`, `useSetMyProviderProfilePaused`, `useSaveOffering`,
  `useDeleteOffering`, `useAddMedia`, `useDeleteMedia`.
- Web (`features/provider-onboarding/`) :
  - P6 `/devenir-prestataire` : argumentaire (« gratuit au lancement »), bouton qui crée le profil, met la session à jour
    (`setUser` du store) puis ouvre l'onboarding. Un visiteur passe d'abord par la connexion.
  - S1 `/pro/onboarding` : 7 étapes + récapitulatif, barre de progression, transition animée (Motion) entre étapes.
    Chaque « Continuer » enregistre l'étape et `onboardingStep` : on reprend là où on s'était arrêté.
    Le récapitulatif affiche la checklist de la règle n° 2 et envoie en validation.
  - S7 `/pro/profil` : les mêmes sections en onglets (`ProfileSections.tsx`, partagées avec S1), aperçu de la carte
    de recherche, pause / réactivation, lien vers la page publique.
  - Tableau de bord : bandeau tant que le profil n'est pas en ligne (brouillon, en validation, corrections, pause).
  - Schémas de formulaire séparés : `features/provider-onboarding/lib/profileForms.ts` ; euros ↔ centimes partagés
    dans `apps/web/src/lib/money.ts`.
  - Photos : fichier réduit à 1200 px et gardé en « data URL » dans la base mockée, ou photo d'exemple en un clic.
- Playwright : `e2e/onboarding.spec.ts` (parcours 5 : une cliente devient prestataire et envoie son profil).

## Ce que contient le lot 6

- Handlers (`mocks/handlers/reviews.ts`) : `POST /api/reviews` (règle n° 6 via `canReviewBooking`, puis note recalculée
  par `computeProviderRating`, règle n° 8), `POST /api/reviews/:id/reply` (une seule réponse, par le prestataire concerné),
  `GET /api/me/provider/reviews` (S8, avis masqués compris). Le signalement passe par `POST /api/reports` (lot 4).
- `BookingSummary` porte maintenant `review` (l'avis éventuel) : la carte de réservation sait si le bouton s'affiche.
- API : `listMyReviews()`. Hooks (`queries/useReviews.ts`) : `useCreateReview`, `useMyReviews`, `useReplyToReview`.
- Web (`features/reviews/`) :
  - C6 `/espace/avis/:bookingId` : note générale obligatoire, 3 sous-notes facultatives (« les trois ou aucune »),
    commentaire. Étoiles = boutons radio masqués (`StarRatingInput`, clavier et lecteurs d'écran inclus).
    Schéma de formulaire séparé : `features/reviews/lib/reviewForm.ts`. Après l'envoi, retour sur le profil avec
    « Merci ! Ton avis est publié. » et la nouvelle moyenne.
  - Bouton « Laisser un avis » sur la carte de réservation, seulement si `canReviewBooking` l'autorise ;
    sinon la note laissée s'affiche.
  - S8 `/pro/avis` : moyenne, avis sans réponse, sous-notes, réponse publique unique (`ReplyForm`), signalement
    (`ReportDialog`, motifs « faux avis », « contenu inapproprié », « autre »), badge « Masqué par la modération ».
- Playwright : `e2e/review.spec.ts` (parcours 4 : la cliente laisse un avis, la moyenne et le nombre d'avis changent).

## Ce que contient le lot 5

- Règle n° 5 : `canAcceptQuote` + `acceptQuote` (`packages/common/src/rules/acceptQuote.ts`, testées).
- Handlers : `POST /api/quotes`, `POST /api/quotes/:id/accept`, `POST /api/quotes/:id/decline`, `GET /api/bookings?side=`,
  `POST /api/bookings/:id/cancel`, `GET /api/me/provider/dashboard`, `GET/POST /api/me/provider/unavailabilities`,
  `DELETE /api/me/provider/unavailabilities/:id`, `GET/PATCH /api/me/provider` (le PATCH sert au réglage
  « max par jour » ; l'onboarding du lot 7 s'appuiera dessus). `mocks/bookings.ts` : `completePastBookings`, `toBookingSummary`.
- Hooks (`queries/useBookings.ts`) : `useCreateQuote`, `useAcceptQuote`, `useDeclineQuote`, `useBookings`,
  `useCancelBooking`, `useProviderDashboard`, `useMyUnavailabilities`, `useBlockDate`, `useUnblockDate`,
  `useMyProviderProfile`, `useUpdateMyProviderProfile`.
- Web :
  - S4 `/pro/demandes/:id/devis` : lignes dynamiques (`useFieldArray`), total et acompte en direct, montants saisis en
    euros « à la française » (`features/quotes/lib/quoteForm.ts`), reprise de la version précédente pour négocier.
  - C3 : devis détaillés (`QuoteCard`), « Accepter » (adresse + conditions d'annulation) / « Refuser » ;
    bloc réservation (`BookingPanel`) avec adresse révélée et annulation (`CancelBookingDialog`, remboursement prévu affiché).
  - C5 `/espace/reservations` ; S2 `/pro` (3 chiffres, demandes récentes, prochaines dates) ;
    S6 `/pro/agenda` (mois, réservé / bloqué / libre, clic pour bloquer/débloquer, réglage « max par jour »).
  - Grille de calendrier partagée : `apps/web/src/lib/calendar.ts`.
  - Maquette v2 : boutons en pilule, variante `cta` (soleil orangé) pour l'action principale d'un écran
    (Rechercher, Demander un devis, Envoyer, Accepter) ; menu pro brun (`SpaceNav tone="dark"`).
  - Correctif mobile : les textes `sr-only` des pastilles débordaient (page plus large que l'écran) → pastilles en `relative`.
    En-tête : texte court « Mode client / Mode pro » sur téléphone.
- Playwright : `e2e/booking.spec.ts` (parcours 2 et 3).

## Reste à faire côté maquette v2

- Accueil façon référence de Mouss : photo pleine largeur sous l'en-tête, grand titre avec mot accent (`text-title-accent`),
  recherche en pilule, bordure à motif de losanges. Logo piste 1 à intégrer quand le fichier final sera prêt.

## Ce que contient le lot 4

- Handlers MSW (`packages/common/src/mocks/handlers/quoteRequests.ts` et `messaging.ts`) :
  `POST/GET /api/quote-requests`, `GET /api/quote-requests/:id`, `POST …/:id/decline` (prestataire, avec motif),
  `POST …/:id/cancel` (client), `GET /api/conversations?side=`, `GET/POST /api/conversations/:id/messages`,
  `POST /api/conversations/:id/read`, `POST /api/reports`. Une demande ou conversation qui n'est pas à toi renvoie 404.
- Effets de bord regroupés dans `mocks/conversations.ts` : `postMessage` (masquage règle n° 7 + compteurs de non-lus),
  `expireStaleQuoteRequests` (expiration à 7 jours vérifiée à chaque lecture des demandes, avec message système),
  `extendQuoteRequestOnProviderReply` (une réponse du prestataire relance le délai de 7 jours).
- Règles appliquées côté serveur mocké : n° 3 (date indisponible → 409), n° 4 (soi-même → 403), n° 7 (masquage).
  Une demande déclinée, expirée ou annulée ferme la conversation (409 `conversation_closed`).
- Hooks : `useQuoteRequests`, `useQuoteRequest`, `useCreateQuoteRequest`, `useDeclineQuoteRequest`,
  `useCancelQuoteRequest`, `useConversations`, `useMessages`, `useSendMessage`, `useMarkConversationRead`,
  `useUnreadCount`, `useCreateReport`. Messagerie rafraîchie toutes les 7 s (`MESSAGING_REFRESH_MS`) en attendant le temps réel.
- Utilitaires : `formatEventDate`, `formatMessageTime`, `formatDateTime` (heure de Paris), `CLIENT_TYPE_LABELS`,
  `REPORT_REASON_LABELS`.
- Web :
  - C1 `/prestataires/:slug/demande` (protégée : connexion puis retour). Schéma de saisie à part
    (`features/quote-requests/lib/requestForm.ts`) : les champs HTML sont du texte et le budget est en euros ;
    `toCreateQuoteRequestInput` convertit en nombres et centimes. Après l'envoi : ouverture de la conversation (`?envoyee=1`).
    Date : champ natif (pas de Calendar shadcn) + vérification des jours pris avant l'envoi.
  - C2/C3 et S3 : une seule page par écran avec `side` en paramètre (`RequestsPage`, `RequestDetailPage`), onglets
    En cours / Réservations / Terminées (gardés dans `?onglet=`), « Poser une question », « Décliner » (motifs suggérés),
    « Annuler la demande ».
  - C4/S5 : `MessagesPage` partagée (liste + fil sur ordinateur, l'un ou l'autre sur téléphone), messages système
    centrés, avertissement « coordonnées masquées », Entrée pour envoyer, pastille de non-lus dans le menu.
  - `components/ReportDialog.tsx` : bouton « Signaler » réutilisable (message aujourd'hui, profil et avis plus tard).
- Playwright : `e2e/request.spec.ts` (parcours 1 et 7).

## Ce que contient le lot 3

- Recherche « serveur » : `searchProviders` (`packages/common/src/mocks/search.ts`, fonction pure testée) : catégorie (une
  catégorie principale inclut ses sous-catégories), origines, texte (sans accents), ville, date (règle n° 3), budget (les
  « sur devis » restent), invités, note, vérifié ; tri pertinence (note pondérée par le nombre d'avis) / note / prix ;
  pagination (12 par page).
- Handlers : `GET /api/providers` (recherche), `/api/providers/:slug` (profil public), `/:id/reviews`, `/:id/unavailable-dates`.
- Hooks : `useProviderSearch`, `useProvider`, `useProviderReviews`, `useUnavailableDates`, `useCulturalOrigins`.
- Utilitaires partagés : `formatOfferingPrice`, libellés français (`EVENT_TYPE_LABELS`, `LEGAL_TYPE_LABELS`, `languageLabel`).
- Web : filtres dans l'adresse en français (`features/search/lib/searchParams.ts` : `categorie`, `origines`, `ville`,
  `date`, `budget` en euros, `invites`, `note`, `verifie`, `tri`, `page`) ; accueil (P1) avec recherche Quoi/Où/Quand ;
  résultats (P2) ; pages catégorie (P4) avec titre pour Google (`usePageMeta`) ; profil (P5) avec galerie + visionneuse,
  formules, calendrier de disponibilités en lecture, avis, politique d'annulation, bouton « Demander un devis ».
- Transition douce entre les pages publiques (Motion, respecte « réduire les animations »).
- Thème : tokens de la maquette v1 appliqués (`packages/config/tailwind/theme.css`, copie JSON dans `tokens.json`). Nom et logo Wenzee depuis le 23/11/2026 (voir « Changement de marque »). Maquette : `/mnt/project-files/maquette/` et https://claude.ai/artifact/9bkx1UDkFjBKFEKMGTrVGv.

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

La liste complète (choix actuel, impact, échéance) est dans [`questions-ouvertes.md`](questions-ouvertes.md).

- Menu latéral pro en brun (`bg-sidebar`) à faire avec le tableau de bord S2 (lot 5).
- Préfixe des paquets : garder `@afro/…` ou passer à `@wenzee/…` (lot 11).

## Écarts assumés par rapport à la conception

- `Notification`, `Payment`, `Dispute`, `Favorite` : pas de schéma au MVP (prévu).
- `Quote.lines` : les lignes sont renvoyées dans le devis (pas de route séparée pour `QuoteLine`).
- `Booking` a en plus `quoteRequestId` et `cancelledAt` (pratique pour les écrans et la règle n° 9).
- `ProviderProfile.postalCode` peut être vide pour un brouillon d'onboarding.
- Lot 7 : modifier un profil déjà publié ne le renvoie pas en validation (choix de Mouss pour l'instant, voir [`questions-ouvertes.md`](questions-ouvertes.md) n° 1).
- Lot 8 : pas de notification au prestataire après une décision (le modèle `Notification` arrive avec les emails, lot 11) ;
  il voit son nouveau statut et le motif dans son espace.
- Lot 7 : pas d'upload réel au MVP mocké, les photos sont des « data URL » (vrai stockage au lot 10 avec Supabase).
- Page d'accueil : « à la une » = les 8 profils publiés les mieux notés (en attendant la mise en avant payante).
