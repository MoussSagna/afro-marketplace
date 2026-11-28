import type { Category, ProviderCard } from '@afro/common';
import { mainCategoryOf } from '../search/providerLabels';

/** Une pastille de filtre : une catégorie principale et le nombre de favoris qu'elle contient. */
export type FavoriteCategoryChip = { category: Category; count: number };

export type FavoritesView = {
  /** Les favoris à afficher, du plus récent au plus ancien (l'ordre des cœurs). */
  items: ProviderCard[];
  /** Tous les favoris trouvés (pour le compteur), quel que soit le filtre. */
  total: number;
  /** Une pastille par catégorie principale présente, la plus fournie d'abord. */
  chips: FavoriteCategoryChip[];
  /** La catégorie réellement appliquée (null si elle n'a plus de favori : on revient à « Tous »). */
  selectedId: string | null;
};

/**
 * Ce que montre l'écran Favoris, à partir des cœurs (les identifiants du store) et des cartes chargées.
 * - Seuls les identifiants encore dans le store comptent : un cœur retiré disparaît aussitôt, sans attendre
 *   le rechargement des cartes.
 * - Un favori introuvable (profil retiré) est ignoré.
 * - Le filtre porte sur la catégorie principale (comme la Recherche : « Traiteur & boissons »…).
 */
export function favoritesView(
  ids: string[],
  cards: ProviderCard[] | undefined,
  categories: Category[] | undefined,
  selectedId: string | null,
): FavoritesView {
  const byId = new Map((cards ?? []).map((card) => [card.id, card]));
  const all = ids.map((id) => byId.get(id)).filter((card) => card !== undefined);

  const counts = new Map<string, FavoriteCategoryChip>();
  const mainOf = new Map<string, string | undefined>();
  for (const card of all) {
    const main = mainCategoryOf(card.categoryIds, categories);
    mainOf.set(card.id, main?.id);
    if (!main) continue;
    const chip = counts.get(main.id) ?? { category: main, count: 0 };
    chip.count += 1;
    counts.set(main.id, chip);
  }
  const chips = [...counts.values()].sort(
    (a, b) => b.count - a.count || a.category.order - b.category.order,
  );
  const applied = selectedId && counts.has(selectedId) ? selectedId : null;
  return {
    items: applied ? all.filter((card) => mainOf.get(card.id) === applied) : all,
    total: all.length,
    chips,
    selectedId: applied,
  };
}
