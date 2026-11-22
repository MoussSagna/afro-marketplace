import { formatDateTime, useCategories, useProvidersToReview } from '@afro/common';
import { UserCheck } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { AdminTable } from '../components/AdminTable';

/** A2 : les profils envoyés en validation, les plus anciens d'abord. */
export function ProvidersToReviewPage() {
  const providers = useProvidersToReview();
  const categories = useCategories();
  usePageMeta('Profils à valider');
  const categoryNames = (ids: string[]) =>
    ids
      .map((id) => categories.data?.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');

  return (
    <section aria-labelledby="to-review-title" className="flex flex-col gap-6">
      <h1 id="to-review-title" className="text-3xl font-semibold">
        Profils à valider
      </h1>
      {providers.isPending && <Skeleton className="h-40 rounded-xl" aria-label="Chargement" />}
      {providers.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger les profils.
        </p>
      )}
      {providers.isSuccess && providers.data.length === 0 && (
        <EmptyState
          icon={UserCheck}
          title="Rien à valider"
          description="Tous les profils envoyés ont été traités."
        />
      )}
      {providers.isSuccess && providers.data.length > 0 && (
        <AdminTable
          caption="Profils en attente de validation"
          head={['Prestataire', 'Catégories', 'Ville', 'Envoyé le']}
        >
          {providers.data.map((provider) => (
            <tr key={provider.id}>
              <td className="px-4 py-3 font-medium">
                <Link
                  to={`/admin/prestataires/${provider.id}`}
                  className="text-primary hover:underline"
                >
                  {provider.displayName}
                </Link>
              </td>
              <td className="px-4 py-3">{categoryNames(provider.categoryIds)}</td>
              <td className="px-4 py-3">{provider.city}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(provider.updatedAt)}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </section>
  );
}
