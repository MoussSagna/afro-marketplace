import { useCategories } from '@afro/common';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
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
    <div className="mx-auto max-w-6xl px-4 py-8">
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
        showCategoryFilter={false}
      />
    </div>
  );
}
