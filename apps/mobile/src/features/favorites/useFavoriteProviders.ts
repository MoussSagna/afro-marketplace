import { useCategories, useProviderSearch } from '@afro/common';
import { useFavoritesStore } from '@/stores/favorites';
import { favoritesView } from './favoritesView';

/** La recherche n'accepte pas plus de 50 identifiants à la fois (voir questions-ouvertes). */
const MAX_FAVORITES = 50;

/**
 * Les cartes des prestataires mis en favori. Les cœurs restent dans le store existant (sur le téléphone) :
 * le même état que la Recherche et la fiche, donc un retrait ici se voit partout, et inversement.
 * Les cartes viennent de la recherche existante (filtre `ids`, données MSW).
 */
export function useFavoriteProviders(selectedCategoryId: string | null) {
  const ids = useFavoritesStore((state) => state.ids);
  const categories = useCategories();
  // Triés pour la clé de cache : remettre un cœur déjà chargé ne recharge rien d'autre que nécessaire.
  const queryIds = [...ids].slice(0, MAX_FAVORITES).sort();
  const cards = useProviderSearch(
    { ids: queryIds, pageSize: MAX_FAVORITES },
    { enabled: queryIds.length > 0 },
  );
  const view = favoritesView(ids, cards.data?.items, categories.data, selectedCategoryId);
  return { ...view, hasFavorites: ids.length > 0, cards };
}
