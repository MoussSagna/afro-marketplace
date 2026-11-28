# App mobile : header dynamique des fiches prestataires

Demande de Mouss (28/11/2026) : sur la fiche prestataire, un header en surimpression où **le nom remonte dans la
barre** quand on fait défiler, sans jamais déplacer Retour ni Favori. Périmètre : `apps/mobile` uniquement.
Aucune maquette fournie avec la demande : la référence est la description de la demande (états A, B, C).

## 1. Ce qui a été fait

| Fichier (`apps/mobile/…`)                                         | Rôle                                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/components/dynamic-header/useDynamicHeader.ts` (nouveau)     | Toute la logique de scroll : suivi Reanimated, mesure du titre, Safe Area, `titleRevealProgress`        |
| `src/components/dynamic-header/DynamicVendorHeader.tsx` (nouveau) | Le header : Retour, nom au centre, Favori, voile translucide (expo-blur)                                |
| `src/components/dynamic-header/index.ts` (nouveau)                | Point d'entrée                                                                                          |
| `src/features/provider-profile/ProviderProfileScreen.tsx`         | `ScrollView` → `Animated.ScrollView` (le même scroll, rien de plus) ; branche le header et le favori    |
| `src/features/provider-profile/ProfileGallery.tsx`                | Le bouton Retour quitte la galerie pour le header (photos, compteur et visionneuse inchangés)           |
| `src/test/reanimatedMock.tsx`                                     | Faux Reanimated : `Animated.ScrollView`, `useAnimatedScrollHandler`, `useDerivedValue`, `Extrapolation` |

### Réutiliser le header sur une autre fiche

```tsx
const header = useDynamicHeader();
<Animated.ScrollView {...header.scrollProps}>
  <View {...header.contentProps}>
    …
    <View {...header.titleProps}><Heading>{name}</Heading></View>
  </View>
</Animated.ScrollView>
<DynamicVendorHeader {...header.headerProps} title={name} onBack={…} isFavorite={…} onToggleFavorite={…} />
```

Le header ne connaît aucun prestataire : il reçoit un titre, l'état du favori et deux actions.

## 2. Comment le titre sait quand apparaître

Pas de seuil fixe en pixels : on suit la **position réelle** du titre principal.

1. `onLayout` sur le titre → `measureLayout` donne sa position **dans la page** (`titleTop`) et sa hauteur.
2. `useAnimatedScrollHandler` suit le scroll sur le fil des animations : **aucun re-render React** pendant le défilement.
3. Bas du header = Safe Area du haut + 56 pt.
4. `titleRevealProgress` : 0 tant que le titre est sous le header, 1 dès que son bas passe derrière le header,
   fondu entre les deux (sur la hauteur du titre, au moins 40 pt de défilement).
5. Le voile arrive à 0 → 40 % de la progression, le nom à 25 → 100 %, et il monte de 8 pt jusqu'à sa place.

Ça marche quelle que soit la longueur du contenu, la taille de l'écran ou la Safe Area. Le titre est remesuré si la
mise en page change (pastilles qui se chargent, nom sur deux lignes). Tant qu'il n'est pas mesuré, le header reste sans
titre : pas de clignotement au chargement.

## 3. Cycles de validation (iPhone 17, simulateur iOS 27, Expo Go 58)

Captures prises avec un paramètre de défilement **temporaire** (`?capY=`, `?capTab=`, `?capTitle=`), retiré
ensuite : le simulateur n'a pas d'outil pour faire glisser le doigt.

| Cycle | Constat                                                                                                                                       | Correction                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1     | État A conforme (ronds sur la photo, pas de titre, pas de fond). État C conforme. Le rond Retour, crème, disparaît sur le voile crème         | Ombre douce et liseré fin sur les deux ronds             |
| 2     | État B : à mi-parcours, le nom du header se pose sur les pastilles qui passent derrière un voile encore trop léger : lecture brouillée        | Le voile précède le nom (voile 0 → 40 %, nom 25 → 100 %) |
| 3     | A, B, C conformes : le titre glisse sous le voile, puis le nom apparaît en fondu et remonte. Nom long : une ligne et « … », boutons inchangés | —                                                        |

Remarque : sur l'onglet Formules de « Saveurs de Dakar », la page est courte (≈ 230 pt de défilement), donc le
titre principal ne sort jamais de l'écran et le header reste sans titre. C'est le comportement voulu. Les états B et C
ont été pris sur l'onglet Avis.

## 4. Ce qui reste à vérifier (écarts non cachés)

- **Autres tailles d'écran** : la capture sur iPhone 17e a été bloquée par la confirmation iOS « Ouvrir dans Expo Go ? »
  (impossible à toucher sans outil de saisie). Le calcul tient compte de la Safe Area (testé en unitaire : petite
  barre Android, Dynamic Island), mais il faut le voir sur un iPhone SE et sur Android.
- **Android** : expo-blur n'y floute pas ; on garde un voile translucide sans flou (comme la barre d'onglets).
- **Thème sombre** : voile fumé prévu (`VEIL.dark`), pas capturé.
- **Fluidité au doigt** : les captures sont à des positions fixes. Le fondu et la montée sont à juger en vrai, au
  doigt (aucun re-render, l'animation tourne sur le fil UI).

## 5. Tests

- `src/components/dynamic-header/dynamicHeader.test.tsx` (12) : progression (A, B, C, Safe Area, hauteur du titre,
  titre non mesuré) ; header (états A / B / C, ellipsis, titre caché aux lecteurs d'écran, Safe Area, Retour, Favori).
- `src/features/provider-profile/profile.test.tsx` (+3) : Retour ramène à la recherche ; le cœur partage les favoris
  des cartes ; le scroll ne re-rend pas la fiche.
- Mobile : TypeScript, ESLint, Prettier OK ; **362 tests Jest** au vert.

Captures : `docs/screenshots/mobile-dynamic-header/` le temps de la relecture, **supprimées avant la PR**
(règle de Mouss, `agents/conventions.md`).
