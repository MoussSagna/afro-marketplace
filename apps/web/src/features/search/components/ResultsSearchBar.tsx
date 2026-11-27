import type { ProviderSearchFilters } from '@afro/common';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  draftFromFilters,
  filtersFromDraft,
  useSearchDraft,
  type SearchDraftValues,
} from '../lib/searchDraft';
import { MobileSearch } from './guided-search/MobileSearch';
import { SearchPill } from './guided-search/SearchPill';
import { GuidedSearchActionContext } from './guided-search/useGuidedSearch';

interface ResultsSearchBarProps {
  filters: ProviderSearchFilters;
  /** Appelé avec la prestation, le mot-clé, la ville et la date choisis. */
  onSearch: (changes: Partial<ProviderSearchFilters>) => void;
  className?: string;
}

/**
 * La recherche en haut des résultats : **la même que celle de l'accueil** (`SearchBar`), à deux différences près :
 * - elle part des filtres de l'adresse (le lien ouvert, la recherche précédente) ;
 * - « Rechercher » met à jour la page au lieu d'y retourner, et garde les autres filtres (origines, note, tri…).
 * Tablette et ordinateur : la pilule « Quoi ? / Où ? / Quand ? » ; téléphone : le plein écran par étapes.
 */
export function ResultsSearchBar({ filters, onSearch, className }: ResultsSearchBarProps) {
  const { category, q, city, date } = filters;

  // Le brouillon (partagé par toutes les barres) reprend les filtres de l'adresse à chaque changement.
  useEffect(() => {
    useSearchDraft.getState().set(draftFromFilters({ category, q, city, date }));
  }, [category, q, city, date]);

  const search = (draft: SearchDraftValues) => {
    const next = filtersFromDraft(draft);
    onSearch({ category: next.category, q: next.q, city: next.city, date: next.date });
  };

  return (
    <GuidedSearchActionContext.Provider value={search}>
      <div data-search-top className={cn('w-full', className)}>
        <SearchPill className="hidden md:block lg:mx-auto lg:max-w-[1120px]" />
        <MobileSearch className="md:hidden" />
      </div>
    </GuidedSearchActionContext.Provider>
  );
}
