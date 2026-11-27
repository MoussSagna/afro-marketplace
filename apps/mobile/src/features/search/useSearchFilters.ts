import { filtersFromParams, paramsFromFilters, type ProviderSearchFilters } from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { RESULTS_VIEW, searchMode } from './searchState';

/** Les noms des filtres dans l'adresse de l'écran (les mêmes que sur le site), plus `vue` (app seulement). */
const PARAM_NAMES = [
  'q',
  'categorie',
  'origines',
  'ville',
  'date',
  'budget',
  'invites',
  'note',
  'verifie',
  'tri',
  'page',
  'vue',
] as const;

/** Les paramètres d'Expo Router ({ ville: 'Paris' }) au format URLSearchParams, attendu par common. */
export function toUrlSearchParams(raw: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  }
  return params;
}

/**
 * Les filtres de la recherche, rangés dans l'adresse de l'écran (`/?categorie=beaute&ville=Paris`),
 * comme sur le site : un lien peut ouvrir une recherche toute prête, et « retour » retrouve les filtres.
 * - `filters` : les filtres actuels ; `mode` : « home » (accueil de la recherche) ou « results » ;
 * - `update({ city: 'Paris' })` : en change quelques-uns, et passe aux résultats ;
 * - `replace(filtres, { results })` : les remplace tous ;
 * - `showAll()` : les résultats, sans filtre (« Voir tout ») ;
 * - `clearFilters()` : retire les filtres en restant sur les résultats ;
 * - `reset()` : retire tout et revient à l'accueil de la recherche.
 */
export function useSearchFilters() {
  const raw = useLocalSearchParams<Record<string, string>>();
  const router = useRouter();
  const key = JSON.stringify(raw);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- on recalcule quand l'adresse change (key)
  const filters = useMemo(() => filtersFromParams(toUrlSearchParams(raw)), [key]);
  const mode = searchMode(filters, raw.vue);

  const replace = useCallback(
    (next: ProviderSearchFilters, { results = true }: { results?: boolean } = {}) => {
      const params = paramsFromFilters({ ...next, page: undefined });
      const values: Record<string, string | undefined> = Object.fromEntries(
        PARAM_NAMES.map((name) => [name, params.get(name) ?? undefined]),
      );
      values.vue = results ? RESULTS_VIEW : undefined;
      // Un filtre absent est remis à undefined : Expo Router le retire alors de l'adresse.
      router.setParams(values);
    },
    [router],
  );
  const update = useCallback(
    (changes: Partial<ProviderSearchFilters>) => replace({ ...filters, ...changes }),
    [filters, replace],
  );
  const showAll = useCallback(() => replace({}), [replace]);
  const clearFilters = useCallback(() => replace({}), [replace]);
  const reset = useCallback(() => replace({}, { results: false }), [replace]);

  return { filters, mode, update, replace, showAll, clearFilters, reset };
}
