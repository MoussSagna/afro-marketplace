import { filtersFromParams, paramsFromFilters, type ProviderSearchFilters } from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

/** Les noms des filtres dans l'adresse de l'écran (les mêmes que sur le site). */
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
 * Les filtres de la recherche, rangés dans l'adresse de l'écran (`/recherche?categorie=beaute&ville=Paris`),
 * comme sur le site : l'Accueil peut ouvrir une recherche toute prête, et « retour » retrouve les filtres.
 * - `filters` : les filtres actuels ;
 * - `update({ city: 'Paris' })` : en change quelques-uns ;
 * - `replace(filtres)` : les remplace tous ; `reset()` : les retire tous.
 */
export function useSearchFilters() {
  const raw = useLocalSearchParams<Record<string, string>>();
  const router = useRouter();
  const key = JSON.stringify(raw);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- on recalcule quand l'adresse change (key)
  const filters = useMemo(() => filtersFromParams(toUrlSearchParams(raw)), [key]);

  const replace = useCallback(
    (next: ProviderSearchFilters) => {
      const params = paramsFromFilters({ ...next, page: undefined });
      // Un filtre absent est remis à undefined : Expo Router le retire alors de l'adresse.
      router.setParams(
        Object.fromEntries(PARAM_NAMES.map((name) => [name, params.get(name) ?? undefined])),
      );
    },
    [router],
  );
  const update = useCallback(
    (changes: Partial<ProviderSearchFilters>) => replace({ ...filters, ...changes }),
    [filters, replace],
  );
  const reset = useCallback(() => replace({}), [replace]);

  return { filters, update, replace, reset };
}
