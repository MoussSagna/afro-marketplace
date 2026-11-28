# App mobile : écran Favoris

Demande de Mouss (28/11/2026) : l'onglet Favoris affichait « Bientôt disponible ». Il liste maintenant les
prestataires gardés d'un cœur dans la Recherche (ou sur leur fiche). Périmètre : `apps/mobile`, plus un petit filtre
dans `@afro/common`. Choix à valider : `agents/questions-ouvertes.md` n° 34.

## 1. L'écran

- **En-tête** : « Favoris » et le compteur (« 5 prestataires gardés »).
- **Pastilles par catégorie principale** (« Tous (5) », « Musique & animation (3) »…), seulement s'il y a au moins
  deux catégories. Si la catégorie choisie n'a plus de favori, on revient à « Tous ».
- **Grille de 2 colonnes** avec la petite carte des rangées de la Recherche (`ProviderMiniCard`, réutilisée telle
  quelle) : photo, « Coup de cœur » ou « Vérifié », cœur, nom, note, catégorie · ville, prix. Du plus récent au plus
  ancien.
- **Toucher la carte** ouvre la fiche. **Toucher le cœur** retire le favori : la carte s'efface en fondu, les autres
  glissent à leur place (Reanimated : `FadeOut`, `LinearTransition`).
- **Sous chaque carte** : « Devis » (demande de devis existante) et une icône « Ajouter à un événement » (le panneau
  du bas de la #79). Sans compte, la connexion d'abord, puis retour à l'action.
- **État vide** : cœur sur un rond sable (comme l'état vide des événements), « Pas encore de coup de cœur », et
  « Explorer les prestataires » qui ramène à la Recherche.

## 2. Données

- Les cœurs restent dans le store existant (`stores/favorites.ts`, AsyncStorage) : la Recherche, la fiche et cet
  écran lisent le même état. Un retrait ici se voit dans la Recherche, et inversement.
- Les cartes viennent de la recherche existante avec un nouveau filtre `ids` (schéma, mock MSW, handler) : 50 au plus
  par appel. Rien n'est chargé sans favori (`useProviderSearch(filters, { enabled })`).
- Un cœur retiré disparaît aussitôt, sans attendre le rechargement (`favoritesView` ne garde que les identifiants
  encore dans le store). Un favori dont le profil n'est plus publié est ignoré.

## 3. Validation visuelle (iPhone 17e, 390 × 844, simulateur iOS 27, Expo Go 58)

Captures prises avec un paramètre **temporaire** (favoris et thème choisis par l'adresse), retiré ensuite.
Aucune maquette Favoris n'était disponible (`maquette-mobile/` absent de ce Mac) : la référence est la Recherche.

| Cycle | Constat                                                                                                                                       | Correction                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1     | Clair conforme. **Sombre : titres noirs** (« Favoris », « Pas encore de coup de cœur ») ; même défaut sur l'onglet Compte : c'est toute l'app | `cn` : `tailwind-merge` prenait `text-h1/h2/h3` pour des couleurs et supprimait `text-foreground`. Tailles déclarées |
| 2     | Clair et sombre conformes (liste et état vide)                                                                                                | —                                                                                                                    |

## 4. Écarts et points ouverts

- **Moti** n'est pas installé : animations faites avec Reanimated (déjà là). Moti seulement si Mouss le veut.
- **Tests** : l'app mobile se teste avec Jest (Vitest ne fait pas tourner React Native) ; Vitest couvre `@afro/common`.
- **« Nouvel événement »** depuis le panneau ramène sur la fiche du prestataire, pas sur Favoris.
- **`text-body` / `text-caption`** : même défaut de `cn`, qui supprime ici la taille (texte courant en 14 px au lieu
  de 16). Non corrigé : cela changerait le texte de toute l'app (question n° 34).
- Android, gestes au doigt et longue liste : non vérifiés sur appareil.

## 5. Tests

- `favoritesView.test.ts` (6) : ordre des cœurs, retrait immédiat, favori introuvable, pastilles, filtre, retour à « Tous ».
- `favorites.test.tsx` (9) : état vide → Recherche ; affichage, ordre, compteur, cœurs et actions ; retrait (puis
  état vide) ; filtre par catégorie ; carte → fiche ; « Devis » sans compte puis connecté ; « Ajouter à un
  événement » ; **synchro Recherche ↔ Favoris**.
- `tabLabels.test.tsx` adapté (l'onglet n'est plus vide), `cn.test.ts` (+1).
- `@afro/common` (Vitest) : filtre `ids` dans la recherche mock et via l'adresse (+2).

Captures : `docs/screenshots/mobile-favoris/` le temps de la relecture, **supprimées avant la PR** (règle de Mouss).
