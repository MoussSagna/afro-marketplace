import type { ProviderSearchFilters } from '@afro/common';

/**
 * Le paramètre d'adresse qui force l'état « résultats » sans aucun filtre
 * (« Voir tout », ou « Tout » dans la rangée de catégories) : `/?vue=resultats`.
 */
export const RESULTS_VIEW = 'resultats';

/**
 * Vrai si une recherche est en cours : un texte, une catégorie ou un filtre.
 * Le tri par défaut (« Pertinence ») et la page ne comptent pas.
 */
export function isSearching(filters: ProviderSearchFilters): boolean {
  return Boolean(
    filters.q ||
    filters.category ||
    filters.origins?.length ||
    filters.city ||
    filters.date ||
    filters.budgetMax ||
    filters.guests ||
    filters.minRating ||
    filters.verifiedOnly ||
    (filters.sort && filters.sort !== 'relevance'),
  );
}

/**
 * L'onglet Recherche a deux états :
 * - « accueil » : la barre de recherche, puis les catégories et les prestataires à la une ;
 * - « résultats » : les catégories en rangée, les résultats, le tri et les filtres.
 * On est en « résultats » dès qu'une recherche est en cours, ou si l'adresse le demande (`vue=resultats`).
 */
export function searchMode(
  filters: ProviderSearchFilters,
  view: string | undefined,
): 'home' | 'results' {
  return view === RESULTS_VIEW || isSearching(filters) ? 'results' : 'home';
}
