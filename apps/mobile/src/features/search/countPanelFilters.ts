import type { ProviderSearchFilters } from '@afro/common';

/** Le nombre de filtres actifs du panneau (la pastille sur le bouton Filtres). */
export function countPanelFilters(filters: ProviderSearchFilters): number {
  return [
    filters.sort && filters.sort !== 'relevance',
    filters.budgetMax,
    filters.minRating,
    filters.origins?.length,
    filters.verifiedOnly,
  ].filter(Boolean).length;
}
