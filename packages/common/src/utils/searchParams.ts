import type { ProviderSearchFilters, ProviderSort } from '../types';

/*
 * Les filtres de recherche vivent dans l'ADRESSE de la page :
 *   /recherche?categorie=traiteurs&origines=senegal,mali&date=2027-06-12&budget=2000
 * Avantages : on peut partager le lien, le bouton « retour » du navigateur
 * fonctionne, et un rechargement garde les filtres.
 *
 * Les noms sont en français (ce sont des adresses visibles), les montants en euros.
 * Ces deux fonctions traduisent dans les deux sens, et ignorent les valeurs invalides.
 * Partagées par le site (?categorie=… dans la barre d'adresse) et l'app (paramètres d'Expo Router).
 */

const SORT_TO_PARAM: Record<ProviderSort, string> = {
  relevance: 'pertinence',
  rating: 'note',
  price_asc: 'prix-croissant',
  price_desc: 'prix-decroissant',
};
const PARAM_TO_SORT = Object.fromEntries(
  Object.entries(SORT_TO_PARAM).map(([sort, param]) => [param, sort as ProviderSort]),
) as Record<string, ProviderSort>;

function positiveNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

export function filtersFromParams(params: URLSearchParams): ProviderSearchFilters {
  const text = (key: string) => params.get(key)?.trim() || undefined;
  const budgetEuros = positiveNumber(params.get('budget'));
  const guests = positiveNumber(params.get('invites'));
  const rating = positiveNumber(params.get('note'));
  const page = positiveNumber(params.get('page'));
  const date = text('date');
  const origins = text('origines')?.split(',').filter(Boolean);

  return {
    q: text('q'),
    category: text('categorie'),
    origins: origins?.length ? origins : undefined,
    city: text('ville'),
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    budgetMax: budgetEuros === undefined ? undefined : Math.round(budgetEuros) * 100,
    guests: guests === undefined ? undefined : Math.round(guests),
    minRating: rating === undefined ? undefined : Math.min(rating, 5),
    verifiedOnly: params.get('verifie') === '1' || undefined,
    sort: PARAM_TO_SORT[params.get('tri') ?? ''],
    page: page === undefined ? undefined : Math.round(page),
  };
}

export function paramsFromFilters(filters: ProviderSearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  const set = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  };
  set('q', filters.q);
  set('categorie', filters.category);
  set('origines', filters.origins?.join(','));
  set('ville', filters.city);
  set('date', filters.date);
  set('budget', filters.budgetMax === undefined ? undefined : Math.round(filters.budgetMax / 100));
  set('invites', filters.guests);
  set('note', filters.minRating);
  if (filters.verifiedOnly) params.set('verifie', '1');
  if (filters.sort && filters.sort !== 'relevance') params.set('tri', SORT_TO_PARAM[filters.sort]);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  return params;
}

/** Le nombre de filtres actifs (pour le bouton « Filtres (3) » sur téléphone). */
export function countActiveFilters(filters: ProviderSearchFilters): number {
  return [
    filters.q,
    filters.origins?.length,
    filters.city,
    filters.date,
    filters.budgetMax,
    filters.guests,
    filters.minRating,
    filters.verifiedOnly,
  ].filter(Boolean).length;
}
