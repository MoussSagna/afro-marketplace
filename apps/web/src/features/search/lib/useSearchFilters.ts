import { filtersFromParams, paramsFromFilters } from '@afro/common';
import type { ProviderSearchFilters } from '@afro/common';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Les filtres de recherche, lus et écrits dans l'adresse de la page.
 * Changer un filtre revient à la page 1 (sauf si c'est la page qu'on change).
 */
export function useSearchFilters(fixed: Partial<ProviderSearchFilters> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const filters = useMemo(() => ({ ...fromUrl, ...fixed }), [fromUrl, fixed]);

  function update(changes: Partial<ProviderSearchFilters>) {
    const next = { ...fromUrl, ...changes };
    if (!('page' in changes)) next.page = undefined;
    setSearchParams(paramsFromFilters(next));
    // Remonter en haut des résultats quand on change de page.
    if ('page' in changes) window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setSearchParams(new URLSearchParams());
  }

  return { filters, update, reset };
}
