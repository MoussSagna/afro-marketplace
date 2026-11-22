import {
  useCategories,
  useProviderSearch,
  type ProviderSearchFilters,
  type ProviderSort,
} from '@afro/common';
import { SearchX, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { useId, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { countActiveFilters } from '../lib/searchParams';
import { ProviderCard } from './ProviderCard';
import { SearchFilters } from './SearchFilters';

interface SearchResultsProps {
  filters: ProviderSearchFilters;
  onChange: (changes: Partial<ProviderSearchFilters>) => void;
  onReset: () => void;
  showCategoryFilter?: boolean;
}

const SORT_LABELS: Record<ProviderSort, string> = {
  relevance: 'Pertinence',
  rating: 'Meilleures notes',
  price_asc: 'Prix croissant',
  price_desc: 'Prix décroissant',
};

/**
 * Filtres + liste de résultats + tri + pagination.
 * Partagé par la page de recherche (P2) et les pages catégorie (P4).
 */
export function SearchResults({
  filters,
  onChange,
  onReset,
  showCategoryFilter = true,
}: SearchResultsProps) {
  const id = useId();
  const search = useProviderSearch(filters);
  const categories = useCategories();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = countActiveFilters(filters);

  const categoryName = (categoryId: string | undefined) =>
    categories.data?.find((category) => category.id === categoryId)?.name;

  const totalPages = search.data
    ? Math.max(1, Math.ceil(search.data.total / search.data.pageSize))
    : 1;
  const page = search.data?.page ?? 1;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="md:w-64 md:shrink-0">
        {/* Sur téléphone, les filtres sont repliés derrière un bouton. */}
        <Button
          variant="outline"
          className="w-full md:hidden"
          aria-expanded={filtersOpen}
          aria-controls={`${id}-filters`}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal aria-hidden />
          Filtres{activeFilters > 0 && ` (${activeFilters})`}
        </Button>
        <div id={`${id}-filters`} className={filtersOpen ? 'mt-4 md:mt-0' : 'hidden md:block'}>
          <SearchFilters
            filters={filters}
            onChange={onChange}
            onReset={onReset}
            showCategory={showCategoryFilter}
          />
        </div>
      </aside>

      <section className="min-w-0 flex-1" aria-label="Résultats">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {search.data && `${search.data.total} prestataire${search.data.total > 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-2">
            <Label htmlFor={`${id}-sort`} className="text-sm whitespace-nowrap">
              Trier par
            </Label>
            <NativeSelect
              id={`${id}-sort`}
              value={filters.sort ?? 'relevance'}
              onChange={(event) => onChange({ sort: event.target.value as ProviderSort })}
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {search.isPending && (
          <div
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            role="status"
            aria-label="Chargement"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-80 rounded-xl" />
            ))}
          </div>
        )}

        {search.isError && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
            La recherche n’a pas pu aboutir. Réessaie dans un instant.
          </p>
        )}

        {search.isSuccess && search.data.items.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="Aucun prestataire ne correspond"
            description="Essaie d’élargir ta recherche : une autre date, une autre ville, ou moins de filtres."
            action={
              <Button variant="outline" onClick={onReset}>
                Effacer les filtres
              </Button>
            }
          />
        )}

        {search.isSuccess && search.data.items.length > 0 && (
          <>
            <ul
              className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              // Pendant le chargement de la page suivante, on garde l'ancienne, un peu estompée.
              style={{ opacity: search.isPlaceholderData ? 0.6 : 1 }}
            >
              {search.data.items.map((provider, index) => (
                <motion.li
                  key={provider.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
                >
                  <ProviderCard
                    provider={provider}
                    categoryName={categoryName(provider.categoryIds[0])}
                  />
                </motion.li>
              ))}
            </ul>

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => onChange({ page: page - 1 })}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => onChange({ page: page + 1 })}
                >
                  Suivant
                </Button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
