import { addDays, parseIsoDate, type ProviderSearchFilters } from '@afro/common';

/** Une rangée de l'état initial de la Recherche : son nom (clé des textes) et sa recherche. */
export type HomeSection = {
  id: 'topRated' | 'saturday' | 'paris' | 'smallBudget';
  filters: ProviderSearchFilters;
};

/** Nombre de cartes par rangée (« Tout voir » ouvre la recherche complète). */
export const HOME_SECTION_SIZE = 8;

/** Budget des « Petits budgets » : 300 €, en centimes. */
export const SMALL_BUDGET = 30_000;

/** Le prochain samedi (aujourd'hui si on est samedi), en jour ISO. */
export function nextSaturday(today: string): string {
  const day = parseIsoDate(today).getUTCDay(); // 0 = dimanche … 6 = samedi
  return addDays(today, (6 - day + 7) % 7);
}

/**
 * Les rangées horizontales de l'état initial (façon Airbnb : « Logements populaires à Paris », etc.).
 * Chacune est une recherche ordinaire : « Tout voir » ouvre les résultats avec les mêmes filtres.
 * Pas de nouvelle API : on réutilise la recherche (données de démo MSW).
 */
export function homeSections(today: string): HomeSection[] {
  return [
    { id: 'topRated', filters: { minRating: 4.5, sort: 'rating' } },
    { id: 'saturday', filters: { date: nextSaturday(today), sort: 'rating' } },
    { id: 'paris', filters: { city: 'Paris', sort: 'rating' } },
    { id: 'smallBudget', filters: { budgetMax: SMALL_BUDGET, sort: 'price_asc' } },
  ];
}
