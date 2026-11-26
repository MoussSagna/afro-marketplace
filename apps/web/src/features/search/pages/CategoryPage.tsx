import { paramsFromFilters, useCategories, type ProviderSearchFilters } from '@afro/common';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SearchResults } from '../components/SearchResults';
import { useSearchFilters } from '../lib/useSearchFilters';

/**
 * P4 : une page par catégorie (/categories/traiteurs).
 * Même composant que la recherche, avec la catégorie imposée, un titre et un
 * texte d'introduction : c'est ce que Google indexera pour « traiteur africain Paris ».
 */
export function CategoryPage() {
  const { slug = '' } = useParams();
  const categories = useCategories();
  const category = categories.data?.find((c) => c.slug === slug);
  const parent = categories.data?.find((c) => c.id === category?.parentId);
  const subCategories = categories.data?.filter((c) => c.parentId === category?.id) ?? [];

  const fixed = useMemo(() => ({ category: slug }), [slug]);
  const { filters, update, reset } = useSearchFilters(fixed);
  const navigate = useNavigate();

  /**
   * « Rechercher » depuis une page catégorie : même prestation → on reste ici (ville, date mises à jour) ;
   * autre prestation ou mot-clé → recherche générale, avec le choix fait et les autres filtres.
   */
  function searchFromCategory(changes: Partial<ProviderSearchFilters>) {
    if (changes.category === slug) {
      update({ city: changes.city, date: changes.date });
      return;
    }
    const params = paramsFromFilters({ ...filters, ...changes, page: undefined });
    void navigate(`/recherche?${params.toString()}`);
  }

  const title = category ? `${category.name} afro en Île-de-France` : undefined;
  usePageMeta(
    title,
    category &&
      `Trouvez les meilleurs prestataires « ${category.name} » de la diaspora africaine et antillaise en Île-de-France. Comparez les avis et demandez un devis gratuit.`,
  );

  if (categories.isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="h-10 w-80" />
      </div>
    );
  }
  if (!category) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-[96rem] px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pt-8 xl:px-12">
      <nav aria-label="Fil d’Ariane" className="mb-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">
          Accueil
        </Link>
        {parent && (
          <>
            {' › '}
            <Link to={`/categories/${parent.slug}`} className="hover:underline">
              {parent.name}
            </Link>
          </>
        )}
        {' › '}
        <span aria-current="page">{category.name}</span>
      </nav>
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-2 mb-4 max-w-3xl text-muted-foreground">
        Comparez les prestataires, leurs formules et leurs avis, puis demandez un devis gratuit en
        quelques minutes. Le paiement se fait directement avec le prestataire.
      </p>
      {subCategories.length > 0 && (
        <ul className="mb-6 flex flex-wrap gap-2" aria-label="Sous-catégories">
          {subCategories.map((sub) => (
            <li key={sub.id}>
              <Link
                to={`/categories/${sub.slug}`}
                className="inline-block rounded-full border bg-card px-3 py-1 text-sm hover:bg-muted"
              >
                {sub.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <SearchResults
        filters={filters}
        onChange={update}
        onReset={reset}
        onSearch={searchFromCategory}
      />
    </div>
  );
}
