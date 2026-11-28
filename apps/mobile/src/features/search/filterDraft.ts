import type { ProviderSearchFilters } from '@afro/common';
import { BUDGET_LIMIT } from './BudgetSlider';

/**
 * Ce que règle le panneau des filtres. Ce sont les filtres QUE LE MOTEUR CONNAÎT
 * (`ProviderSearchFilters`, @afro/common) : une catégorie, une ville, une date, un budget maximum,
 * une note minimale, des origines, le tri, les profils vérifiés. Le texte (q) et les invités restent
 * dans la recherche plein écran (la pilule).
 */
export type FiltersDraft = Pick<
  ProviderSearchFilters,
  'category' | 'city' | 'date' | 'budgetMax' | 'minRating' | 'origins' | 'sort' | 'verifiedOnly'
>;

export const DRAFT_KEYS = [
  'category',
  'city',
  'date',
  'budgetMax',
  'minRating',
  'origins',
  'sort',
  'verifiedOnly',
] as const satisfies readonly (keyof FiltersDraft)[];

/** Le brouillon de départ : une COPIE des filtres en cours (rien n'est appliqué avant validation). */
export function draftFrom(filters: ProviderSearchFilters): FiltersDraft {
  const draft: FiltersDraft = {};
  for (const key of DRAFT_KEYS) {
    if (filters[key] !== undefined) Object.assign(draft, { [key]: filters[key] });
  }
  return draft;
}

/**
 * Ce que « Afficher les résultats » envoie à la recherche : chaque filtre du panneau, présent ou
 * remis à `undefined` (un filtre retiré dans le panneau doit disparaître de la recherche).
 */
export function draftChanges(draft: FiltersDraft): Partial<ProviderSearchFilters> {
  return Object.fromEntries(DRAFT_KEYS.map((key) => [key, draft[key]])) as FiltersDraft;
}

/** Les suggestions de budget : des MAXIMUMS (le moteur ne connaît pas de minimum), en centimes. */
export const BUDGET_SUGGESTIONS = [50_000, 100_000, 200_000, BUDGET_LIMIT] as const;

/** Les notes minimales proposées (le moteur garde les prestataires dont la moyenne les atteint). */
export const RATING_OPTIONS = [4, 4.5, 5] as const;

/** Un jour local au format ISO (« 2026-12-05 »). */
function iso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Le samedi de « Ce week-end » (aujourd'hui si on est samedi, demain si on est dimanche… on prend
 * le samedi qui vient ; le dimanche, celui de la semaine suivante), et celui du « Week-end prochain ».
 * Le moteur ne cherche qu'UNE date : le raccourci choisit le samedi.
 */
export function weekendDates(today = new Date()): { thisWeekend: string; nextWeekend: string } {
  const day = today.getDay(); // 0 = dimanche … 6 = samedi
  const toSaturday = (6 - day + 7) % 7;
  const saturday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + toSaturday);
  const next = new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate() + 7);
  return { thisWeekend: iso(saturday), nextWeekend: iso(next) };
}
