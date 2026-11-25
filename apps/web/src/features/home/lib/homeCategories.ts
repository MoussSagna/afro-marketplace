import { paramsFromFilters } from '@afro/common';

/**
 * Les 8 grandes catégories mises en avant sur l'accueil : une seule source pour les raccourcis
 * du hero (icônes) et la mosaïque « Explorez nos univers » (photos).
 * `categorySlug` est le slug d'une catégorie du catalogue (`packages/common/src/mocks/seed/catalogue.ts`).
 */
export const HOME_CATEGORIES = {
  traiteur: { label: 'Traiteur', categorySlug: 'traiteurs' },
  danse: { label: 'Danse', categorySlug: 'danse' },
  musique: { label: 'Musique & DJ', categorySlug: 'dj' },
  show: { label: 'Show', categorySlug: 'spectacle' },
  speaker: { label: 'Speaker', categorySlug: 'speakers' },
  beaute: { label: 'Beauté', categorySlug: 'beaute' },
  mode: { label: 'Mode', categorySlug: 'location-de-tenues' },
  decoration: { label: 'Décoration', categorySlug: 'decoration' },
} as const satisfies Record<string, { label: string; categorySlug: string }>;

export type HomeCategoryId = keyof typeof HOME_CATEGORIES;

/** L'adresse de la recherche filtrée sur une catégorie (ex. `/recherche?categorie=dj`). */
export function categorySearchUrl(categorySlug: string) {
  return `/recherche?${paramsFromFilters({ category: categorySlug }).toString()}`;
}
