# App mobile : refonte de la liste des conversations (onglet Messages)

Demande de Mouss (28/11/2026), d'après une maquette « Messages » (ASOS / Airbnb / WhatsApp). Périmètre :
`apps/mobile`, plus des textes dans `@afro/common` (i18n). **Le fil de discussion et le système de messagerie ne
changent pas.** Branche `feat/mobile-messages-refonte` (depuis `dev`), PR vers `dev`. **Validée par Mouss le 28/11/2026.**

## 1. L'écran

- **En-tête** : « Messages », la loupe et « Nouvelle conversation » (icône crayon).
  - La loupe ouvre un champ sous le titre ; la liste se filtre **à chaque lettre**, sans tenir compte des accents ni
    des majuscules, sur le nom **et** la catégorie (« traiteur » trouve Saveurs de Dakar). Croix pour effacer ;
    toucher la loupe à nouveau ferme et vide la recherche.
  - « Nouvelle conversation » reprend le parcours existant : une conversation naît d'une demande de devis, donc le
    bouton ouvre la Recherche (fiche → demande). Côté prestataire, pas de bouton (il ne démarre pas d'échange).
- **Pastilles** : « Tous », « Non lus (n) », « Devis ». Pastille choisie : fond ocre clair (`bg-cta/25`). Le compteur
  ne s'affiche que s'il y a des non-lus. Masquées s'il n'y a aucune conversation.
- **Lignes** : avatar rond 52 pt (photo du prestataire, sinon initiales), nom (+ badge vérifié ocre), catégorie,
  dernier message sur une ligne avec « … », date à droite (« 12:08 », « Hier », « 26 nov. »), chevron.
  - Non lue : point ocre avant le nom, nom et aperçu en gras, rond ocre avec le nombre (« 9+ » au-delà), fond
    légèrement ocre (`bg-cta/10`).
  - Message de la cliente : préfixe « Toi : » ; message automatique (« Devis n° 2 envoyé ») en italique.
  - Toute la ligne ouvre la conversation (`conversationHref`, inchangé). Traits fins entre les lignes.
- **États** : squelettes en forme de lignes pendant le chargement (immobiles si « Réduire les animations ») ;
  « Pas encore de messages » ; « Aucune conversation trouvée » (+ « Effacer la recherche ») ; « Tout est lu » et
  « Aucun devis pour l'instant » (+ « Voir toutes les conversations ») ; erreur « Impossible de charger tes messages »
  (+ « Réessayer »). Tirer pour rafraîchir conservé.
- **Barre du bas** : inchangée (pastille des non-lus, rétractation au défilement, marge `TAB_BAR_SPACE`).

## 2. Données (rien de nouveau côté serveur)

Le résumé de conversation n'a ni photo, ni catégorie, ni badge, ni devis. `useConversationList` croise trois requêtes
**déjà utilisées** par l'app (même cache TanStack Query) : `useConversations` (rafraîchie toutes les 7 s),
`useQuoteRequests` (une demande par conversation, avec la fiche du prestataire et le dernier devis) et `useCategories`.
La logique (croisement, pastilles, recherche, compteurs) est dans `conversationList.ts`, sans écran, testée seule.

- **Devis** = conversations où un devis a été envoyé (`latestQuote`). Toutes les conversations naissent d'une demande
  de devis : les montrer toutes n'aurait pas de sens.
- **Non lus (n)** = nombre de **conversations** non lues (ce que montre la pastille) ; la barre du bas garde le nombre
  de **messages** non lus.
- Si les demandes ne chargent pas, la liste reste utilisable (sans photo ni catégorie) ; seule l'erreur des
  conversations affiche l'écran d'erreur.
- Côté prestataire (S5) : nom du client, type d'événement (« Mariage ») sous le nom, photo du client ou initiales.

## 3. Validation visuelle (simulateurs iOS 27, Expo Go 58)

Captures prises avec un paramètre **temporaire** (connexion de démo, thème, pastille et recherche choisis par
l'adresse), retiré ensuite : le simulateur n'a pas d'outil pour toucher l'écran. Le rond bleu en haut à droite des
captures est le bouton des outils d'Expo Go, absent de l'app.

| Cycle | Format                          | Constat                                                                                                                  | Correction                                                   |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 1     | iPhone 17 (390 × 844)           | **Grand vide** entre les pastilles et la liste : la rangée horizontale s'étire sur toute la hauteur libre                | `grow-0` sur la rangée                                       |
| 2     | 390 × 844                       | Conforme (pastilles, point ocre, fond non lu, badge, dates). Lignes plus hautes que la maquette (≈ 89 pt contre ≈ 72)    | Avatar 56 → 52, nom 17 → 16 px, marges verticales resserrées |
| 3     | 390 × 844, clair / sombre       | Tous, Non lus, recherche + clavier, sombre conformes. **Recherche vide : « Effacer la recherche » caché par le clavier** | Petits états vides placés en haut de la liste (plus centrés) |
| 3     | iPhone 18 Pro Max (≈ 440 × 956) | Longue liste (autre session de démo) : défilement sous la barre flottante, « Non lus » sans compteur à 0, conformes      | —                                                            |

## 4. Choix validés, écarts et points ouverts

Validés par Mouss (28/11/2026) : tutoiement ; « Devis » = conversations avec un devis envoyé ; « Non lus (n) » =
nombre de conversations non lues ; « Nouvelle conversation » ouvre la Recherche, masqué côté prestataire.
Points ouverts : `agents/questions-ouvertes.md` n° 35 à 38.

- **Tutoiement** : « Toi : » et « Contacte un prestataire… » au lieu de « Vous : » / « Contactez… » de la maquette,
  comme toute l'app. À changer en une ligne dans `fr.ts` si Mouss préfère le vouvoiement ici.
- **Catégories** : les vraies données diffèrent des exemples de la maquette (Compagnie Akwaba est en « Musique &
  animation », Glow by Aminata en « Beauté & soins »).
- **Badge vérifié** : à côté du nom pour tous (la maquette le met une fois sur l'avatar, une fois à côté du nom).
- **Gestes de balayage (archiver, marquer non lu) : non faits.** Le faux serveur n'a ni archivage ni « marquer non
  lu » ; les ajouter changerait le système de messagerie, hors périmètre. À prévoir avec le back-end.
- La pastille « Devis » se met à jour quand les demandes sont rechargées (après une action, ou en revenant sur l'écran),
  pas toutes les 7 s comme les messages.
- **Android 360 × 800** : aucun émulateur Android sur ce Mac, à vérifier sur un téléphone. **430 × 932 exact** : pas de
  simulateur à cette taille ; vérifié sur le Pro Max, plus grand.

## 5. Tests

- `conversationList.test.ts` (7) : croisement client / prestataire / sans demandes ; compteurs ; Tous / Non lus / Devis ;
  recherche sans accents, sur la catégorie, combinée à une pastille.
- `messaging.test.tsx` (+7) : catégorie, badge, « Toi : » ; pastilles et compteur ; « Tout est lu » → retour à Tous ;
  recherche, aucun résultat, effacer, fermer ; ligne non lue → fil ouvert et marqué lu ; « Nouvelle conversation » →
  Recherche ; erreur puis « Réessayer ». Les 6 tests d'origine passent (titre de l'état vide adapté).
- `dates.test.ts` (+1) : « 08:12 », « Hier » (y compris le 1er du mois), « 26 nov. ».
- 416 tests mobiles et 421 tests `@afro/common` au vert ; TypeScript, ESLint, Prettier OK.

Captures : `docs/screenshots/mobile-messages/` le temps de la relecture, **supprimées avant la PR** (règle de Mouss).
