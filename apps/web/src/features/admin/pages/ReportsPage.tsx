import {
  ApiError,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  formatDateTime,
  reportStatusSchema,
  useAdminReports,
  useResolveReport,
  type AdminReport,
  type ReportStatus,
} from '@afro/common';
import { Flag } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/utils';
import { StatusPill } from '../components/AdminTable';
import { ReasonDialog } from '../components/ReasonDialog';

const TARGET_LABELS: Record<AdminReport['targetType'], string> = {
  review: 'Avis',
  message: 'Message',
  provider: 'Profil',
  media: 'Photo',
  user: 'Compte',
};

/** A3 : les signalements. Classer sans suite, masquer le contenu ou suspendre son auteur. */
export function ReportsPage() {
  const [status, setStatus] = useState<ReportStatus | undefined>('open');
  const reports = useAdminReports(status);
  usePageMeta('Signalements');
  const filters: { value: ReportStatus | undefined; label: string }[] = [
    ...reportStatusSchema.options.map((value) => ({ value, label: REPORT_STATUS_LABELS[value] })),
    { value: undefined, label: 'Tous' },
  ];

  return (
    <section aria-labelledby="reports-title" className="flex flex-col gap-6">
      <h1 id="reports-title" className="text-3xl font-semibold">
        Signalements
      </h1>
      <div role="group" aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.label}
            size="sm"
            variant={status === filter.value ? 'default' : 'outline'}
            aria-pressed={status === filter.value}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
      {reports.isPending && (
        <Skeleton className="h-40 rounded-xl" role="status" aria-label="Chargement" />
      )}
      {reports.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger les signalements.
        </p>
      )}
      {reports.isSuccess && reports.data.length === 0 && (
        <EmptyState
          icon={Flag}
          title="Aucun signalement"
          description="Rien à traiter ici pour le moment."
        />
      )}
      {reports.isSuccess && reports.data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {reports.data.map((report) => (
            <li key={report.id}>
              <ReportItem report={report} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReportItem({ report }: { report: AdminReport }) {
  const resolve = useResolveReport(report.id);
  const { target } = report;
  const isOpen = report.status === 'open';

  return (
    <article
      aria-label={`Signalement : ${target.label}`}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-2">
          <StatusPill>{TARGET_LABELS[report.targetType]}</StatusPill>
          <span className="font-medium">{target.label}</span>
          {target.hidden && <StatusPill tone="danger">Déjà masqué</StatusPill>}
        </p>
        <StatusPill tone={isOpen ? 'warning' : 'neutral'}>
          {REPORT_STATUS_LABELS[report.status]}
        </StatusPill>
      </div>
      {target.excerpt && (
        <blockquote
          className={cn(
            'border-l-2 border-ochre pl-3 text-sm',
            target.hidden && 'text-muted-foreground',
          )}
        >
          {target.excerpt}
        </blockquote>
      )}
      <p className="text-sm text-muted-foreground">
        {REPORT_REASON_LABELS[report.reason]}, signalé par {report.reporter.firstName}{' '}
        {report.reporter.lastNameInitial} le {formatDateTime(report.createdAt)}
        {report.details && <span className="block text-foreground">« {report.details} »</span>}
      </p>
      {resolve.isError && (
        <p role="alert" className="text-sm text-destructive">
          {resolve.error instanceof ApiError ? resolve.error.message : 'L’action a échoué.'}
        </p>
      )}
      {isOpen && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={resolve.isPending}
            onClick={() => resolve.mutate({ outcome: 'dismiss' })}
          >
            Classer sans suite
          </Button>
          <Button
            size="sm"
            disabled={resolve.isPending || target.hidden}
            onClick={() => resolve.mutate({ outcome: 'hide_content' })}
          >
            Masquer le contenu
          </Button>
          {target.ownerId && (
            <ReasonDialog
              trigger={
                <Button size="sm" variant="destructive" disabled={resolve.isPending}>
                  Suspendre le compte
                </Button>
              }
              title="Suspendre le compte"
              description="La personne ne pourra plus se connecter et son profil prestataire sortira de la recherche."
              confirmLabel="Suspendre"
              minLength={0}
              destructive
              onConfirm={(note) =>
                resolve.mutateAsync({ outcome: 'suspend_user', ...(note && { note }) })
              }
            />
          )}
        </div>
      )}
    </article>
  );
}
