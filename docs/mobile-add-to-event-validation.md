# App mobile : « Ajouter à un événement » en panneau du bas (@gorhom/bottom-sheet)

Demande de Mouss (28/11/2026). Périmètre : `apps/mobile`. Aucune règle métier changée.
Audit des autres composants : [`mobile-bottom-sheet-audit.md`](mobile-bottom-sheet-audit.md).
Pas de maquette fournie pour ce panneau : la référence est la demande et la charte de l'app.

## 1. Ce qui a été fait

| Fichier (`apps/mobile/…`)                           | Rôle                                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/features/events/useAddToEvent.ts` (nouveau)    | La logique : `useEvents` + `useAddEventProvider` (existants), état de chaque carte, messages    |
| `src/features/events/AddToEventSheet.tsx` (nouveau) | L'affichage : en-tête, cartes, état vide, message de réussite ou d'erreur, « Nouvel événement » |
| `src/features/events/AddToEventButton.tsx`          | Le bouton ne change pas ; il ouvre le nouveau panneau ; le rouvre au retour du formulaire       |
| `src/features/events/EventFormScreen.tsx`           | Au retour sur la fiche : `?evenementCree=<id>`                                                  |
| `src/components/AppBottomSheet.tsx`                 | `subtitle`, `fitContent` (hauteur du contenu), en-tête dans la poignée, retour Android          |
| `src/test/bottomSheetMock.tsx`                      | Le faux gorhom affiche la poignée et prévient `onChange`                                        |
| `packages/common/src/i18n/fr.ts`, `en.ts`           | Textes du panneau (section `events.sheet`)                                                      |

### Parcours

- **Liste** : une carte par événement (photo du type, nom, type · date, ville, invités, prestataires). Toucher une
  carte ajoute le prestataire : une roue pendant l'envoi, puis une coche verte « Ajouté » et un message vert en haut.
  Les événements où il est déjà : carte bordée de vert, non touchable.
- **Erreur à l'ajout** : message rouge avec la raison de l'API, le panneau reste ouvert.
  **Erreur de chargement** : « Réessayer ».
- **État vide** : illustration, « Tu n'as pas encore d'événement », « Créer mon événement » (le pied disparaît
  pour éviter un doublon).
- **Nouvel événement** : le panneau se ferme, le formulaire existant s'ouvre. À la fin, il ajoute le prestataire
  (comme avant), revient sur la fiche, et **le panneau se rouvre** : « « Soirée de gala » est créé, et Saveurs de
  Dakar y est ajouté. » On ne perd pas le fil.
- Fermeture : glissement, fond, croix, retour Android.

## 2. Cycles de validation (simulateurs iOS 27, Expo Go 58)

Le panneau a été ouvert par un paramètre de capture **temporaire** (connexion de démo + `present()`), retiré ensuite :
le simulateur n'a pas d'outil pour toucher l'écran.

| Cycle | Constat                                                                                                                  | Correction                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 1     | iPhone 17e (390 × 844) : en-tête, cartes, coche, pied conformes. **Panneau trop court** : la 2ᵉ carte passe sous le pied | Cause : gorhom ne compte pas l'en-tête posé à côté de la liste. En-tête déplacé dans `handleComponent`            |
| 2     | Hauteur juste. Reste ~50 pt de vide sous la liste (marge réservée au pied trop grande)                                   | Marge = hauteur réelle du pied                                                                                    |
| 3     | Liste, confirmation et état vide conformes. État vide : « Créer mon événement » + « Nouvel événement » font doublon      | Pied masqué sans événement ; événements chargés avec la fiche (le panneau s'ouvre directement à la bonne hauteur) |

Vérifié aussi sur **iPhone 18 Pro Max** (grand écran) : liste et état vide conformes, méta-infos sur une ligne.

## 3. Ce qui reste à vérifier

- **Android 360 × 800** : aucun émulateur Android sur ce Mac. À vérifier sur un téléphone (gestes, retour, voile).
- **430 × 932 exact** : pas de simulateur à cette taille ; vérifié sur le Pro Max, plus grand.
- **Gestes au doigt** (glisser pour fermer, fluidité), **clavier** (pas de champ dans ce panneau), **longue liste**
  (le défilement au-delà de 90 % est assuré par gorhom, pas capturé : la démo n'a que 2 événements).
- **Thème sombre** : couleurs du thème utilisées partout, pas capturé.
- Écart assumé : **tutoiement** (« Choisis l'événement… », « Tu n'as pas encore d'événement ») au lieu du vouvoiement
  de la demande, comme toute l'app.

## 4. Tests

- `events.test.tsx` (+7) : panneau (sous-titre, infos des cartes), ajout et confirmation, échec de l'ajout, échec du
  chargement puis « Réessayer », état vide (sans doublon) → formulaire, croix sans effet, **création depuis le panneau
  → retour sur la fiche, panneau rouvert, prestataire ajouté**. Les 2 tests d'origine passent sans changement.
- `AppBottomSheet.test.tsx` (+2) : retour Android, sous-titre.
- Mobile : TypeScript, ESLint, Prettier OK ; tests Jest au vert (voir la PR).

Captures : `docs/screenshots/mobile-add-to-event/` le temps de la relecture, **supprimées avant la PR**.
