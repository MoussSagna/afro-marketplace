import {
  countActiveFilters,
  useCategories,
  useCulturalOrigins,
  useProviderSearch,
  type ProviderSearchFilters,
  type ProviderSort,
} from '@afro/common';
import { ChevronDown, RotateCcw, SearchX, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { useId, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useResultsView } from '../lib/resultsView';
import { Pagination } from './Pagination';
import { ProviderCard } from './ProviderCard';
import { ResultsSearchBar } from './ResultsSearchBar';
import { SearchFilters } from './SearchFilters';
import { ViewToggle } from './ViewToggle';

interface SearchResultsProps {
  filters: ProviderSearchFilters;
  onChange: (changes: Partial<ProviderSearchFilters>) => void;
  onReset: () => void;
  /** Ce que fait « Rechercher » dans la barre du haut (par défaut : mettre à jour les filtres de la page). */
  onSearch?: (changes: Partial<ProviderSearchFilters>) => void;
}

const SORT_LABELS: Record<ProviderSort, string> = {
  relevance: 'Pertinence',
  rating: 'Meilleures notes',
  price_asc: 'Prix croissant',
  price_desc: 'Prix décroissant',
};

/** Les colonnes de la grille : 1 sur téléphone, 2 sur tablette, 3 sur grand écran. */
const GRID_CLASS = 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-[1.375rem]';
const LIST_CLASS = 'grid gap-4 lg:gap-5';

/**
 * Barre de recherche + filtres + résultats (grille ou liste) + tri + pagination.
 * Partagé par la page de recherche (P2) et les pages catégorie (P4).
 *
 * - ordinateur (≥ 1024 px) : filtres dans une colonne fixe à gauche ;
 * - tablette et téléphone : filtres dans un panneau latéral, ouvert par le bouton « Filtres ».
 * Toute la recherche vit dans l'adresse (`useSearchFilters`) : ce composant ne fait que l'afficher.
 */
export function SearchResults({ filters, onChange, onReset, onSearch }: SearchResultsProps) {
  const id = useId();
  const search = useProviderSearch(filters);
  const categories = useCategories();
  const origins = useCulturalOrigins();
  const view = useResultsView((state) => state.view);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = countActiveFilters(filters);

  const categoryName = (categoryId: string | undefined) =>
    categories.data?.find((category) => category.id === categoryId)?.name;
  const originNames = (originIds: string[]) =>
    originIds.flatMap((originId) => origins.data?.find((o) => o.id === originId)?.name ?? []);

  const total = search.data?.total ?? 0;
  const totalPages = search.data
    ? Math.max(1, Math.ceil(search.data.total / search.data.pageSize))
    : 1;
  const page = search.data?.page ?? 1;
  const listClass = view === 'grid' ? GRID_CLASS : LIST_CLASS;

  return (
    <div className="flex flex-col gap-6 lg:gap-[3.25rem]">
      <ResultsSearchBar
        filters={filters}
        onSearch={onSearch ?? onChange}
        className="lg:mx-auto lg:w-full lg:max-w-[84rem]"
      />

      <div className="flex items-start gap-6 xl:gap-[1.375rem]">
        {/* Colonne fixe au défilement (sticky) : elle reste à l'écran pendant qu'on parcourt les résultats.
            96 px en haut : la place de la navbar quand elle réapparaît. Si l'écran est trop bas pour tout
            afficher, la colonne défile toute seule (max-h + overflow). */}
        <aside className="sticky top-24 hidden max-h-[calc(100svh-7.5rem)] w-68 shrink-0 overflow-y-auto overscroll-contain rounded-[1.375rem] bg-card p-5 shadow-card ring-1 ring-border/70 lg:block xl:w-[18.75rem]">
          <SearchFilters filters={filters} onChange={onChange} onReset={onReset} />
        </aside>

        <section className="min-w-0 flex-1" aria-label="Résultats">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 lg:mb-6">
            <h2
              className="font-display text-2xl font-bold text-primary sm:text-[2rem]"
              aria-live="polite"
            >
              {search.data ? (
                <>
                  <span>
                    {total} prestataire{total > 1 ? 's' : ''}
                  </span>{' '}
                  trouvé{total > 1 ? 's' : ''}
                </>
              ) : (
                <span className="text-muted-foreground">Recherche…</span>
              )}
            </h2>

            <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-4">
              <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-card px-3.5 text-sm font-semibold text-foreground shadow-card ring-1 ring-border outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring lg:hidden"
                  >
                    <SlidersHorizontal className="size-4" aria-hidden />
                    Filtres
                    {activeFilters > 0 && (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        <span className="sr-only">(</span>
                        {activeFilters}
                        <span className="sr-only">)</span>
                      </span>
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent className="top-0 left-0 flex h-dvh max-h-dvh w-full max-w-[min(26rem,100%)] translate-x-0 translate-y-0 flex-col gap-0 rounded-none rounded-r-2xl border-0 p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-[26rem]">
                  <div className="flex items-center gap-3 border-b border-border/70 py-4 pr-14 pl-5">
                    <DialogTitle className="font-sans text-xl font-bold">Filtres</DialogTitle>
                    <button
                      type="button"
                      onClick={onReset}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <RotateCcw className="size-4" aria-hidden />
                      Réinitialiser
                    </button>
                  </div>
                  <DialogDescription className="sr-only">
                    Les résultats se mettent à jour dès que tu changes un filtre.
                  </DialogDescription>
                  <div className="flex-1 overflow-y-auto px-5 py-5">
                    <SearchFilters
                      filters={filters}
                      onChange={onChange}
                      onReset={onReset}
                      showHeader={false}
                    />
                  </div>
                  <div className="border-t border-border/70 p-4">
                    <DialogClose asChild>
                      <Button className="h-12 w-full rounded-full text-base">
                        {search.data
                          ? `Voir ${total} résultat${total > 1 ? 's' : ''}`
                          : 'Voir les résultats'}
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:flex-none">
                <Label
                  htmlFor={`${id}-sort`}
                  className="text-[0.9375rem] font-normal whitespace-nowrap max-sm:sr-only"
                >
                  Trier par
                </Label>
                <div className="relative min-w-0 flex-1">
                  <select
                    id={`${id}-sort`}
                    value={filters.sort ?? 'relevance'}
                    onChange={(event) => onChange({ sort: event.target.value as ProviderSort })}
                    className="h-11 w-full cursor-pointer appearance-none rounded-full bg-card pr-10 pl-4 text-[0.9375rem] sm:pl-5 font-medium text-foreground shadow-card ring-1 ring-border outline-none focus-visible:ring-[3px] focus-visible:ring-ring sm:min-w-[11.5rem]"
                  >
                    {Object.entries(SORT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
                    aria-hidden
                  />
                </div>
              </div>

              <span aria-hidden className="hidden h-8 w-px bg-border sm:block" />
              <ViewToggle />
            </div>
          </div>

          {search.isPending && (
            <div className={listClass} role="status" aria-label="Chargement">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton
                  key={index}
                  className={cn('rounded-[1.375rem]', view === 'grid' ? 'h-[36rem]' : 'h-56')}
                />
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
                className={listClass}
                data-view={view}
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
                      layout={view}
                      categoryName={categoryName(provider.categoryIds[0])}
                      tags={originNames(provider.culturalOriginIds)}
                    />
                  </motion.li>
                ))}
              </ul>

              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(next) => onChange({ page: next })}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
