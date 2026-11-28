# App mobile : écran « Ta recherche », deux corrections (28/11/2026)

> **Captures avant / après non faites** : Expo Go du simulateur iOS est en 57, le projet en SDK 58 (même blocage que
> `docs/mobile-search-filters-validation.md`). À faire sur les 3 formats (iPhone 390 × 844 et 430 × 932, Android
> 360 × 800) dès qu'Expo Go est à jour ; les captures ne sont pas versionnées.

Modification ciblée de `apps/mobile/src/features/search/SearchWizard.tsx` (la recherche plein écran). Quoi, Où, Quand,
la navigation et la logique de recherche ne changent pas ; aucune dépendance ajoutée.

## 1. Bande beige sous le pied de page

**Cause** : l'écran était dans un `SafeAreaView` beige (`bg-muted`) avec les marges sûres **haut et bas**. La zone
de l'indicateur d'accueil (iPhone) ou de la barre système (Android) restait donc au conteneur beige, sous le pied blanc.

**Correction** :

- Le conteneur ne garde que la marge sûre du **haut** (`edges={['top']}`).
- Le pied de page, dernier élément de la colonne (donc collé en bas, sur toute la largeur), **porte lui-même** la marge
  du bas dans son fond blanc : `paddingBottom: Math.max(insets.bottom, 8)` (`useSafeAreaInsets()`). Le blanc descend
  jusqu'au dernier pixel ; « Tout effacer » et « Rechercher » restent au-dessus de l'indicateur.
- `KeyboardAvoidingView` (iOS) autour du contenu et du pied : le clavier numérique ne cache ni le champ ni les boutons.
- Boutons, tailles et espacements inchangés.

## 2. Invités : un champ numérique au lieu de − / +

- Le composant `Input` existant : libellé « Nombre d'invités », aide « Indique le nombre d'invités (estimation) »
  (l'app tutoie), icône « personnes » (`Users`), `0` en exemple, clavier numérique (`number-pad`).
- Seulement des chiffres (lettres et signes retirés), pas de zéros en tête, plafond 1 000 (l'ancienne limite) ; le champ
  peut rester vide pendant la saisie. Le brouillon reçoit un entier de 1 à 1 000, ou rien (0 ou vide = sans filtre) :
  la valeur envoyée à la recherche est donc toujours valide.
- La valeur est gardée en passant d'une étape à l'autre (le brouillon de l'écran) et part dans `invites` comme avant.
- Supprimés : les boutons − / +, leurs textes (`search.fewerGuests`, `search.moreGuests`) et la constante `GUESTS_STEP`.

## 3. Tests

- `search.test.tsx` : le parcours complet tape « 80 » au lieu de toucher 8 fois « + » ; 4 nouveaux tests (chiffres
  seulement, vide, zéros en tête, plafond ; valeur gardée puis envoyée ; 0 = sans filtre ; pied blanc avec la marge sûre).
- Recherche toujours fonctionnelle : les tests de recherche (plein écran, filtres, résultats) passent tous.
