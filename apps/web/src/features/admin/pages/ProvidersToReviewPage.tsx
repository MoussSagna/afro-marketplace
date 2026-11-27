import { formatDateTime, useCategories, useProvidersToReview } from '@afro/common';
import { ChevronRight, CircleCheck, MapPin, UserCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
  AdminCell,
  AdminFeedback,
  AdminRow,
  AdminTable,
  StatusPill,
} from '../components/AdminTable';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { ProviderThumbnail } from '../components/ProviderThumbnail';

/** Le message laissé par la fiche après une décision (`navigate(…, { state: { flash } })`). */
export interface AdminFlashState {
  flash?: string;
}

/** A2 : les profils envoyés en validation, les plus anciens d'abord. */
export function ProvidersToReviewPage() {
  const providers = useProvidersToReview();
  const categories = useCategories();
  const flash = (useLocation().state as AdminFlashState | null)?.flash;
  usePageMeta('Profils à valider');
  const categoryNames = (ids: string[]) =>
    ids
      .map((id) => categories.data?.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  const count = providers.data?.length ?? 0;

  return (
    <section aria-labelledby="to-review-title" className="flex flex-col gap-6 sm:gap-7">
      <AdminPageHeader
        id="to-review-title"
        title="Profils à valider"
        description="Vérifiez les profils envoyés par les prestataires avant leur mise en ligne."
        actions={providers.isSuccess && <StatusPill tone="warning">{count} en attente</StatusPill>}
      />
      {flash && (
        <AdminFeedback>
          <CircleCheck className="size-4 shrink-0" aria-hidden />
          {flash}
        </AdminFeedback>
      )}
      {providers.isPending && (
        <Skeleton className="h-48 rounded-2xl" role="status" aria-label="Chargement" />
      )}
      {providers.isError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
          Impossible de charger les profils.
        </p>
      )}
      {providers.isSuccess && count === 0 && (
        <EmptyState
          icon={UserCheck}
          title="Rien à valider"
          description="Tous les profils envoyés ont été traités."
        />
      )}
      {providers.isSuccess && count > 0 && (
        <AdminTable
          caption="Profils en attente de validation"
          head={['Prestataire', 'Catégories', 'Localisation', 'Envoyé le', 'Statut', 'Action']}
        >
          {providers.data.map((provider) => {
            const nameId = `provider-${provider.id}`;
            return (
              <AdminRow key={provider.id}>
                <AdminCell label="Prestataire" primary>
                  <div className="flex items-center gap-3">
                    <ProviderThumbnail name={provider.displayName} src={provider.coverUrl} />
                    <Link
                      id={nameId}
                      to={`/admin/prestataires/${provider.id}`}
                      className="text-base font-semibold text-foreground hover:text-primary hover:underline"
                    >
                      {provider.displayName}
                    </Link>
                  </div>
                </AdminCell>
                <AdminCell label="Catégories" className="max-w-56">
                  {categoryNames(provider.categoryIds) || '—'}
                </AdminCell>
                <AdminCell label="Localisation">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <MapPin className="size-4 text-muted-foreground" aria-hidden />
                    {[provider.city, provider.postalCode].filter(Boolean).join(' ') || '—'}
                  </span>
                </AdminCell>
                <AdminCell label="Envoyé le" className="whitespace-nowrap">
                  {formatDateTime(provider.updatedAt)}
                </AdminCell>
                <AdminCell label="Statut">
                  <StatusPill tone="warning">À valider</StatusPill>
                </AdminCell>
                <AdminCell label="Action" primary className="md:text-right">
                  <Button
                    asChild
                    size="sm"
                    className="h-10 gap-1 px-4 has-[>svg]:px-4 max-md:w-full"
                  >
                    <Link to={`/admin/prestataires/${provider.id}`} aria-describedby={nameId}>
                      Examiner
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </AdminCell>
              </AdminRow>
            );
          })}
        </AdminTable>
      )}
    </section>
  );
}
