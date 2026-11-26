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
    <div className="mx-auto max-w-[96rem] px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pt-8 xl:px-12">
      {/* Titre pour les lecteurs d'écran et Google : à l'écran, la barre de recherche et
          « N prestataires trouvés » suffisent (maquette). */}
      <h1 className="sr-only">Rechercher un prestataire</h1>
      <SearchResults filters={filters} onChange={update} onReset={reset} />
    </div>
  );
}
