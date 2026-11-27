# Messagerie mobile : correction responsive et validation visuelle

> Les captures de chaque cycle ont servi à la comparaison mais **ne sont pas versionnées** (règle de Mouss) :
> elles sont dans `docs/screenshots/chat-mobile/` le temps de la relecture, puis supprimées avant la PR.

Correction de la messagerie existante (`/espace/messages/:id` et `/pro/messages/:id`, `MessagesPage` +
`ConversationThread`) selon la méthode **coder → capturer → comparer → corriger → recapturer** (3 cycles maximum,
[`agents/conventions.md`](../agents/conventions.md)). Aucune logique métier modifiée (envoi, masquage des
coordonnées, lecture, signalement inchangés).

## 1. Référence

| Élément          | Valeur                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Références       | Capture du bug + maquette jointes par Mouss le 27/11/2026 (non versionnées)                                  |
| Formats mesurés  | 375 × 812, 390 × 844, 430 × 932 (téléphones, densité 2), 768 × 1024 (tablette), 1440 × 900 (ordinateur)      |
| Scénario         | Aïssatou ouvre la conversation « Saveurs de Dakar » et envoie un mot de 90 lettres sans espace, puis une URL |
| Mesures (script) | Débordement de la page, bulles hors du fil, onglets hors de l'écran ou coupés, écart sous le cadre           |

## 2. État initial et causes techniques

Capture `0-avant-*` (le bug de la capture de Mouss, reproduit) :

| Problème                                  | Cause                                                                                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Texte qui sort des bulles (par la gauche) | `whitespace-pre-line` sans règle de coupure : un mot ou une URL sans espace impose sa largeur minimale à la bulle ; alignée à droite (`self-end`), elle déborde à gauche du fil |
| Onglets coupés (« Messages » à moitié)    | Rangée de 4 onglets de 651 px pour un écran de 375 (836 px pour 768) : elle défile horizontalement et l'onglet actif n'est pas ramené dans la vue                               |
| Nom tronqué (« Saveurs de D… »)           | Une seule ligne partagée entre le retour, le nom, la ligne « type · date longue · Voir la demande » et le statut                                                                |
| Hauteur du cadre approximative            | `h-[calc(100dvh-14rem)] min-h-[28rem]`, fixé avant les nouveaux onglets ; la marge du titre « Messages » était annulée par `md:not-sr-only` (cadre collé au titre)              |
| Défilement vers le dernier message        | `scrollIntoView` sur un repère en bas du fil : fait défiler aussi la page entière sur téléphone                                                                                 |
| Zone d'écriture haute et peu adaptée      | Champ de 2 lignes fixes, bouton carré 36 px ; pas de marge pour la zone de sécurité de l'écran                                                                                  |

## 3. Corrections

| Fichier (`apps/web/src/…`)                             | Correction                                                                                                                                                                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/messaging/components/MessageBubble.tsx`      | `li` : `min-w-0 max-w-[85%]` (70 % dès 640 px) ; bulle : `max-w-full whitespace-pre-wrap [overflow-wrap:anywhere]`, largeur au contenu, bulle reçue sur fond sable                                                      |
| `components/layout/SpaceNav.tsx` (variante `tabs`)     | Téléphone : 4 colonnes égales, icône au-dessus du libellé (sur 2 lignes si besoin, jamais coupé), pastille sur l'icône ; ≥ 640 px : rangée resserrée                                                                    |
| `features/messaging/components/ConversationThread.tsx` | En-tête : avatar (photo du prestataire), nom + badge vérifié, « Mariage · mer. 10 févr. 2027 » ; statut + « Voir la demande » sur une 2ᵉ ligne (téléphone) ou à droite ; défilement de la **liste** seule (`scrollTop`) |
| `features/messaging/components/MessageComposer.tsx`    | Champ d'une ligne qui grandit (`field-sizing: content`, 144 px max.), bouton rond 48 px ; `pb-[max(0.75rem,env(safe-area-inset-bottom))]`                                                                               |
| `features/messaging/pages/MessagesPage.tsx`            | `h-[calc(100dvh-13.25rem)] min-h-[16rem]` (téléphone), `md:h-[calc(100dvh-17.5rem)]` ; écart sous le titre porté par le cadre                                                                                           |
| `index.html`                                           | `interactive-widget=resizes-content` : sur Android, le clavier réduit la zone visible (et `100dvh`), la zone d'écriture reste au-dessus                                                                                 |
| `features/reviews/components/StarRatingInput.tsx`      | Voir section 5 (test e2e d'avis)                                                                                                                                                                                        |
| `app/RootRoute.tsx`                                    | Remplace `ScrollRestoration` (voir `docs/client-dashboard-redesign-validation.md`, section 5)                                                                                                                           |

Structure du fil (inchangée dans son principe, désormais respectée partout) : colonne flex, en-tête et zone d'écriture
à hauteur fixe (`shrink-0`), liste `min-h-0 flex-1 overflow-y-auto overflow-x-hidden` = seule zone qui défile.

## 4. Cycles

### Cycle 1 : première intégration

**Conforme** sur les 5 formats : 0 px de débordement de page, **0 bulle hors du fil**, **0 onglet coupé** (bord droit
359 px pour 375), fil ouvert sur le dernier message. Long mot et URL reviennent à la ligne.

**Écarts relevés** : (1) 375 px : « Voir la demande » sur 2 lignes → en-tête de 117 px ; (2) onglets du téléphone :
icônes à des hauteurs différentes (libellés sur 1 ou 2 lignes) ; (3) 4 px seulement sous le cadre ; (4) ordinateur
et tablette : cadre collé au titre « Messages » (défaut existant).

### Cycle 2 : corrections 1 à 4

`whitespace-nowrap` sur le lien et 2ᵉ ligne alignée à gauche ; icônes des onglets alignées en haut ; hauteur
`100dvh - 13.25rem` (16 px de marge) ; `md:mt-6` sur le cadre. **Bilan** : en-tête 97 px sur les 3 téléphones.

### Cycle 3 : clavier virtuel et champ long

Hauteur minimale ramenée de 384 à 256 px pour que le fil tienne avec le clavier. Simulation du clavier Android
(390 × 844 → 390 × 480) : bas de la zone d'écriture à **465 px**, champ visible. Champ de 7 lignes : il plafonne à
144 px et défile, le bouton reste visible.

## 5. Résultat final

| Format     | En-tête | Zone d'écriture | Bulles hors du fil | Onglets coupés | Débordement page | Marge sous le cadre |
| ---------- | ------- | --------------- | ------------------ | -------------- | ---------------- | ------------------- |
| 375 × 812  | 97 px   | 73 px, visible  | 0                  | 0              | 0                | 16 px               |
| 390 × 844  | 97 px   | 73 px, visible  | 0                  | 0              | 0                | 16 px               |
| 430 × 932  | 97 px   | 73 px, visible  | 0                  | 0              | 0                | 16 px               |
| 768 × 1024 | 73 px   | 73 px, visible  | 0                  | 0              | 0                | 40 px               |
| 1440 × 900 | 73 px   | 73 px, visible  | 0                  | 0              | 0                | 24 px               |

Ordinateur : liste + fil côte à côte comme avant, bulles à 70 % max., aucune régression.

**Test e2e d'avis (parcours 4) rendu instable par les changements de mise en page** : la case radio de chaque étoile
était cachée avec `sr-only` (1 px, marge −1 px), donc posée **1 px à côté** de l'étoile. Le test la coche par un clic
forcé à ses coordonnées : selon l'arrondi des sous-pixels, le clic tombait sur l'étoile ou juste à côté. Correction
dans le composant (pas dans le test) : la case invisible recouvre l'étoile (`absolute inset-0 opacity-0`), toujours
focalisable au clavier et lue comme une case radio.

## 6. Tests

- `MessagesPage.test.tsx` : long message sans espace (règles de retour à la ligne), changement de conversation
  (en-tête, badge, lien vers la demande), Entrée / Maj + Entrée.
- `e2e/chat-mobile.spec.ts` : aux 5 formats, mot long + URL → 0 débordement, 0 bulle hors du fil, 0 onglet coupé,
  dernier message et saisie à l'écran ; clavier simulé ; retour et changement de conversation sur téléphone.

## 7. Limites

| Point                                                           | Pourquoi                                                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clavier iOS non simulable                                       | Safari ne réduit pas `100dvh` avec le clavier : il fait défiler la page pour montrer le champ actif (comportement natif, à vérifier sur un vrai iPhone) |
| Pas de trombone (pièce jointe)                                  | Pas d'envoi de fichiers dans la messagerie (maquette) : non ajouté                                                                                      |
| Pas de séparateur « Aujourd'hui » ni d'accusé de lecture « ✓✓ » | Absents des données / de la logique actuelle : non inventés                                                                                             |
| Heure sous la bulle (pas dedans)                                | Gardée sous la bulle, à côté du bouton « Signaler » des messages reçus                                                                                  |
| Avatar à côté des messages reçus                                | Non ajouté : l'en-tête montre déjà l'interlocuteur                                                                                                      |

## 8. Ajustement du 27/11/2026 (retour de Mouss) : onglets en icônes sur téléphone

« En version mobile, cache les labels s'ils sont sur 2 lignes. » Choix de Mouss parmi 3 propositions : **si au moins
un libellé passerait sur 2 lignes, les 4 onglets passent en icônes seules** (cohérent), les libellés restant lus par
les lecteurs d'écran (`sr-only`) ; ils réapparaissent quand tout tient sur une ligne.

Le CSS ne sait pas détecter un retour à la ligne : `components/layout/useLabelsFit.ts` mesure chaque libellé avec la
police calculée (gras compris pour l'onglet actif, `canvas.measureText`) et le compare à la place dans son onglet ;
recalcul au redimensionnement (`ResizeObserver`), au changement d'onglet et au chargement des polices. Seulement sous
640 px (au-delà, rangée classique).

| Largeur | « Mes demandes » (texte / place) | Résultat                                        |
| ------- | -------------------------------- | ----------------------------------------------- |
| 320–430 | 95 px / 89 px (à 430)            | Icônes seules (24 px), onglets de 48 px de haut |
| 600     | 95 px / ~135 px                  | Libellés visibles, une ligne chacun             |
| ≥ 640   | —                                | Rangée icône + libellé (inchangé)               |

Test : `e2e/chat-mobile.spec.ts` (375 px : icônes seules, noms accessibles gardés ; 600 px : libellés sur une ligne).
