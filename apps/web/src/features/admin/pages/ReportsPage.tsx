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
import {
  CircleCheck,
  Flag,
  Image,
  MessageSquare,
  Star,
  Store,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/utils';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminFeedback, StatusPill } from '../components/AdminTable';
import { ReasonDialog } from '../components/ReasonDialog';

const TARGET_LABELS: Record<AdminReport['targetType'], string> = {
  review: 'Avis',
  message: 'Message',
  provider: 'Profil',
  media: 'Photo',
  user: 'Compte',
};

const TARGET_ICONS: Record<AdminReport['targetType'], LucideIcon> = {
  review: Star,
  message: MessageSquare,
  provider: Store,
  media: Image,
  user: UserRound,
};

/** A3 : les signalements. Classer sans suite, masquer le contenu ou suspendre son auteur. */
export function ReportsPage() {
  const [status, setStatus] = useState<ReportStatus | undefined>('open');
  const [feedback, setFeedback] = useState<string | null>(null);
  const reports = useAdminReports(status);
  const { hash } = useLocation();
  usePageMeta('Signalements');
  const filters: { value: ReportStatus | undefined; label: string }[] = [
    ...reportStatusSchema.options.map((value) => ({ value, label: REPORT_STATUS_LABELS[value] })),
    { value: undefined, label: 'Tous' },
  ];

  // « Examiner » depuis la vue d'ensemble (`#rep-…`) : on amène la carte à l'écran et on lui
  // donne le focus (contour visible), une fois la liste chargée.
  const loaded = reports.isSuccess;
  useEffect(() => {
    if (!loaded || !hash) return;
    const card = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!card) return;
    card.scrollIntoView?.({ block: 'center' });
    card.focus({ preventScroll: true });
  }, [loaded, hash]);

  return (
    <section aria-labelledby="reports-title" className="flex flex-col gap-6 sm:gap-7">
      <AdminPageHeader
        id="reports-title"
        title="Signalements"
        description="Examinez les contenus signalés et décidez de la suite."
      />
      <div
        role="group"
        aria-label="Filtrer par statut"
        className="flex w-full gap-1 overflow-x-auto rounded-xl border bg-card p-1 shadow-card sm:w-fit"
      >
        {filters.map((filter) => {
          const active = status === filter.value;
          return (
            <button
              key={filter.label}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setStatus(filter.value);
                setFeedback(null);
              }}
              className={cn(
                'h-10 shrink-0 rounded-lg px-4 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
                active
                  ? 'bg-title-accent/12 font-semibold text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      {feedback && (
        <AdminFeedback>
          <CircleCheck className="size-4 shrink-0" aria-hidden />
          {feedback}
        </AdminFeedback>
      )}
      {reports.isPending && (
        <Skeleton className="h-48 rounded-2xl" role="status" aria-label="Chargement" />
      )}
      {reports.isError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
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
        <ul className="flex flex-col gap-4">
          {reports.data.map((report) => (
            <li key={report.id}>
              <ReportItem report={report} onDone={setFeedback} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReportItem({
  report,
  onDone,
}: {
  report: AdminReport;
  onDone: (message: string) => void;
}) {
  const resolve = useResolveReport(report.id);
  const { target } = report;
  const isOpen = report.status === 'open';
  const Icon = TARGET_ICONS[report.targetType];
  // `mutateAsync` plutôt que `mutate(…, { onSuccess })` : la carte d'un signalement traité quitte
  // la liste, et un `onSuccess` de `mutate` ne s'exécute plus une fois le composant retiré.
  // L'erreur, elle, s'affiche dans la carte (`resolve.isError`).
  const run = (input: Parameters<typeof resolve.mutateAsync>[0], message: string) =>
    resolve
      .mutateAsync(input)
      .then(() => onDone(message))
      .catch(() => undefined);

  return (
    <article
      id={report.id}
      tabIndex={-1}
      aria-label={`Signalement : ${target.label}`}
      className="flex scroll-mt-28 flex-col gap-4 rounded-2xl border bg-card p-4 shadow-card outline-none focus:ring-[3px] focus:ring-ochre/70 sm:p-5"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-primary sm:size-12"
        >
          <Icon className="size-5 sm:size-6" strokeWidth={1.6} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex flex-wrap items-center gap-2">
              <StatusPill>{TARGET_LABELS[report.targetType]}</StatusPill>
              {target.hidden && <StatusPill tone="danger">Déjà masqué</StatusPill>}
            </p>
            <StatusPill tone={isOpen ? 'terra' : 'neutral'}>
              {REPORT_STATUS_LABELS[report.status]}
            </StatusPill>
          </div>
          <h2 className="font-sans text-base font-semibold sm:text-[17px]">{target.label}</h2>
          <p className="text-sm text-muted-foreground">
            {REPORT_REASON_LABELS[report.reason]}, signalé par {report.reporter.firstName}{' '}
            {report.reporter.lastNameInitial} le {formatDateTime(report.createdAt)}
          </p>
        </div>
      </div>
      {(target.excerpt || report.details) && (
        <div className="flex flex-col gap-3 sm:pl-16">
          {target.excerpt && (
            <blockquote
              className={cn(
                'rounded-r-lg border-l-[3px] border-ochre bg-muted/50 py-2 pr-3 pl-3 text-sm',
                target.hidden && 'text-muted-foreground',
              )}
            >
              {target.excerpt}
            </blockquote>
          )}
          {report.details && (
            <p className="text-sm">
              <span className="text-muted-foreground">Précision : </span>« {report.details} »
            </p>
          )}
        </div>
      )}
      {resolve.isError && (
        <p role="alert" className="text-sm text-destructive sm:pl-16">
          {resolve.error instanceof ApiError ? resolve.error.message : 'L’action a échoué.'}
        </p>
      )}
      {isOpen && (
        <div className="flex flex-wrap gap-2 border-t pt-4 sm:pl-16">
          <Button
            size="sm"
            variant="outline"
            className="h-10"
            disabled={resolve.isPending}
            onClick={() => void run({ outcome: 'dismiss' }, 'Signalement classé sans suite.')}
          >
            Classer sans suite
          </Button>
          <Button
            size="sm"
            className="h-10"
            disabled={resolve.isPending || target.hidden}
            onClick={() =>
              void run({ outcome: 'hide_content' }, 'Contenu masqué : le signalement est traité.')
            }
          >
            Masquer le contenu
          </Button>
          {target.ownerId && (
            <ReasonDialog
              trigger={
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-10"
                  disabled={resolve.isPending}
                >
                  Suspendre le compte
                </Button>
              }
              title="Suspendre le compte"
              description="La personne ne pourra plus se connecter et son profil prestataire sortira de la recherche."
              confirmLabel="Suspendre"
              minLength={0}
              destructive
              onConfirm={(note) =>
                resolve
                  .mutateAsync({ outcome: 'suspend_user', ...(note && { note }) })
                  .then(() => onDone('Compte suspendu : le signalement est traité.'))
              }
            />
          )}
        </div>
      )}
    </article>
  );
}
