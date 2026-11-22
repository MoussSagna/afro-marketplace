import { usePageMeta } from '@/hooks/usePageMeta';
import { SearchResults } from '../components/SearchResults';
import { useSearchFilters } from '../lib/useSearchFilters';

/** P2 : la page de résultats de recherche. */
export function SearchPage() {
  const { filters, update, reset } = useSearchFilters();
  usePageMeta(
    'Rechercher un prestataire',
    'Traiteurs, danseurs, DJ, speakers… Trouvez un prestataire afro en Île-de-France.',
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-display text-3xl font-semibold">Rechercher un prestataire</h1>
      <SearchResults filters={filters} onChange={update} onReset={reset} />
    </div>
  );
}
