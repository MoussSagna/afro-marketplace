# App mobile : refonte des filtres de recherche (bottom sheet)

> **Validation visuelle non faite à ce jour.** Les captures demandées (iPhone 390 × 844 et 430 × 932, Android
> 360 × 800) n'ont pas pu être prises : Expo Go du simulateur iOS est en 57, le projet en SDK 58 (même blocage que
> pour le planificateur, `docs/mobile-event-planner-validation.md`). Les cycles 2 et 3 restent à faire ; les captures
> iront dans `docs/screenshots/mobile-search-filters/` le temps de la relecture, puis seront supprimées avant la PR.

Refonte des filtres de l'onglet Recherche, d'après la maquette fournie par Mouss le 28/11/2026, avec
[`@gorhom/bottom-sheet`](https://github.com/gorhom/react-native-bottom-sheet). La **pilule de recherche n'est pas
modifiée** ; seul l'affichage de son bouton Filtres devient conditionnel. Le moteur de recherche et l'adresse de
l'écran (`useSearchFilters`, la source de vérité) ne changent pas.

## 1. Bouton Filtres : seulement pendant une recherche

| État                 | Source de vérité (`searchMode`, adresse de l'écran)   | Bouton Filtres |
| -------------------- | ----------------------------------------------------- | -------------- |
| Découverte (accueil) | `home` : aucun filtre, pas de `vue=resultats`         | masqué         |
| Recherche lancée     | `results` (catégorie, texte, filtre, « Tout voir »)   | visible        |
| Recherche modifiée   | `results`                                             | visible        |
| Retour en découverte | `home` (« Effacer », onglet retouché, recherche vide) | masqué         |

Ouvrir le champ de recherche (la recherche plein écran) ne suffit pas : c'est l'état de l'écran qui compte, pas le
texte tapé. Seul changement dans `SearchPill` : une option `showFilters` (le bouton est rendu ou non, son style ne
bouge pas).

## 2. Le panneau

- **Composant réutilisable** `src/components/AppBottomSheet.tsx` (demande de Mouss) : `BottomSheetModal`, fond
  assombri (`BottomSheetBackdrop`, on ferme en le touchant), poignée, coins de 28, fermeture par glissement, en-tête
  (croix ou retour, titre, action à droite), `BottomSheetScrollView`, pied fixe (`BottomSheetFooter`), clavier
  (`keyboardBehavior="interactive"`) et zones sûres. S'ouvre par une ref (`present()`).
- **Filtres** `src/features/search/SearchFiltersSheet.tsx` : la liste (Catégorie, Lieu, Date, Budget, Note, Tri,
  Origines, Vérifiés), chaque ligne avec sa valeur ; les sous-écrans (`FilterViews.tsx`) s'ouvrent **dans** le même
  panneau (flèche retour), pas de modale de plus.
- **Brouillon** (`filterDraft.ts`) : à l'ouverture, une copie des filtres en cours ; rien n'est appliqué avant
  « Afficher N prestataires » ; fermer (croix, glissement, fond, bouton retour Android) ne change rien ;
  « Réinitialiser » vide le brouillon sans lancer de recherche.
- **Pied** : « Afficher N prestataires », N compté en direct par le moteur (une page d'un résultat) ; dans un
  sous-écran : « Valider » (retour à la liste).
- Providers à la racine (`app/_layout.tsx`) : `GestureHandlerRootView` autour de l'app, `BottomSheetModalProvider`
  dans `AppProviders` (le panneau a besoin des données et du thème).

## 3. Dépendances

`npx expo install` : `@gorhom/bottom-sheet` 5.2.14 et `react-native-gesture-handler` ~3.3.0 (version du SDK 58 ;
il n'était pas installé). Reanimated 4.7.1 déjà présent. Gesture Handler 3 garde l'API `Gesture` / `GestureDetector`
qu'utilise la bibliothèque (le nouveau détecteur passe la main à l'ancien pour ces gestes).
Tests : faux `src/test/bottomSheetMock.tsx` (branché dans `jest.config.js`), qui ouvre et ferme vraiment le panneau.

## 4. Écarts assumés avec la maquette et la demande (le moteur n'est pas modifié)

| Demandé                               | Fait                                                      | Pourquoi                                                    |
| ------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| Plusieurs catégories                  | Une seule (la toucher à nouveau la retire)                | Le moteur filtre sur UNE catégorie (`category`)             |
| 11 catégories (DJ, Musique, Vidéo…)   | Les 8 catégories principales réelles                      | « Réutiliser les catégories réelles de la marketplace »     |
| Budget à deux poignées (min – max)    | Curseur du maximum (histogramme existant) + « Jusqu'à … » | Le moteur ne connaît qu'un budget maximum (`budgetMax`)     |
| « Dates flexibles », « Ce mois-ci »   | Non ; « Ce week-end », « Week-end prochain » = un samedi  | Le moteur cherche UNE date (disponibilité ce jour-là)       |
| Rayon de recherche, position actuelle | Non                                                       | Non pris en charge (ni moteur ni permission)                |
| Villes proposées                      | Les vraies villes des prestataires, avec leur nombre      | Pas de fausses suggestions (`useCityCounts`, partagé)       |
| « Réinitialiser » en bas à gauche     | En haut à droite (maquette)                               | La maquette est la référence ; un seul « Réinitialiser »    |
| « Appliquer » dans les sous-écrans    | « Valider » (retour à la liste)                           | Seul « Afficher N prestataires » applique : pas d'ambiguïté |
| —                                     | Tri et Origines gardés                                    | Ils existaient : pas de régression                          |

## 5. Tests

- `search/filters.test.tsx` (8) : bouton absent en découverte, présent pendant une recherche, absent au retour, absent
  quand on ouvre seulement le champ ; ouverture et lignes du panneau ; choisir / retirer catégorie, ville, date, note
  puis appliquer (paramètres et résultats) ; Réinitialiser sans appliquer ; fermer sans valider ; brouillon et
  raccourcis du week-end.
- `components/AppBottomSheet.test.tsx` (2) : ouverture / fermeture par la ref, croix, retour.
- Adaptés à la nouvelle interface (même vérification) : `search.test.tsx` (filtres appliqués), `english.test.tsx`.
- Commun 419, web 328, mobile 357 ; lint, types, format ✅.

## 6. Reste à faire

1. Expo Go 58 sur le simulateur (ou captures sur le téléphone), puis cycles 2 et 3 : gestes réels, clavier, hauteur.
2. Relecture de Mouss, puis commit et PR (rien n'est commité).
