import { useAdminReports, useProvidersToReview } from '@afro/common';
import { ChevronRight, CircleCheck, Flag, Goal, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PRIORITY_TASKS_LIMIT, buildPriorityTasks } from '../lib/priorityTasks';
import { AdminPanel } from './AdminPanel';

/**
 * « À traiter en priorité » : les profils à valider et les signalements ouverts, les plus anciens
 * d'abord, limités à quelques lignes ; « Examiner » ouvre le bon dossier.
 */
export function AdminPriorityTasks() {
  const providers = useProvidersToReview();
  const reports = useAdminReports('open');
  const isPending = providers.isPending || reports.isPending;
  const isError = providers.isError || reports.isError;
  const tasks =
    providers.isSuccess && reports.isSuccess
      ? buildPriorityTasks(providers.data, reports.data)
      : [];
  const shown = tasks.slice(0, PRIORITY_TASKS_LIMIT);
  const hidden = tasks.length - shown.length;

  return (
    <AdminPanel
      icon={Goal}
      title="À traiter en priorité"
      description="Les actions qui nécessitent votre attention."
    >
      {isPending && (
        <div role="status" aria-label="Chargement des tâches" className="flex flex-col gap-3 p-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      )}
      {!isPending && isError && (
        <p role="alert" className="m-5 rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger les tâches à traiter.
        </p>
      )}
      {!isPending && !isError && tasks.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-muted text-success">
            <CircleCheck className="size-6" aria-hidden />
          </span>
          <p className="font-display text-xl font-semibold">Aucune tâche à traiter</p>
          <p className="text-muted-foreground">Tous les profils et signalements sont traités.</p>
        </div>
      )}
      {shown.length > 0 && (
        <ul aria-label="Tâches à traiter" className="divide-y">
          {shown.map((task) => {
            const Icon = task.kind === 'provider' ? UserRound : Flag;
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:flex-nowrap sm:px-5"
              >
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-primary sm:size-[52px]"
                >
                  <Icon className="size-6" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-semibold sm:text-[17px]">{task.title}</p>
                  <p
                    className="truncate text-sm text-muted-foreground sm:text-[15px]"
                    title={task.description}
                  >
                    {task.description}
                  </p>
                </div>
                <div className="ml-16 flex w-full items-center justify-between gap-3 sm:ml-0 sm:w-auto sm:justify-end sm:gap-6 xl:gap-10">
                  <span
                    className={cn(
                      'rounded-full px-3.5 py-1 text-sm font-semibold whitespace-nowrap',
                      task.kind === 'provider'
                        ? 'bg-warning-muted text-warning'
                        : 'bg-title-accent/12 text-primary',
                    )}
                  >
                    {task.status}
                  </span>
                  <Button asChild className="h-10 gap-1.5 px-4 has-[>svg]:px-4">
                    <Link to={task.href}>
                      Examiner
                      <span className="sr-only"> : {task.description}</span>
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {hidden > 0 && (
        <p className="mt-auto flex flex-wrap gap-x-5 gap-y-1 border-t px-5 py-3 text-sm">
          <span className="text-muted-foreground">
            {hidden} autre{hidden > 1 ? 's' : ''} tâche{hidden > 1 ? 's' : ''} en attente :
          </span>
          <Link to="/admin/prestataires" className="font-semibold text-primary hover:underline">
            Tous les profils à valider
          </Link>
          <Link to="/admin/signalements" className="font-semibold text-primary hover:underline">
            Tous les signalements
          </Link>
        </p>
      )}
    </AdminPanel>
  );
}
