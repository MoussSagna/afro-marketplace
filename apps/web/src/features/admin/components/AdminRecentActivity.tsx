import { formatDateTime, formatTimeAgo, useAdminActivity } from '@afro/common';
import { Clock, History } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { describeActivity } from '../lib/activityDisplay';
import { AdminPanel } from './AdminPanel';

/** Combien d'événements la vue d'ensemble affiche. */
export const RECENT_ACTIVITY_LIMIT = 3;

/**
 * « Activité récente » : les derniers événements réels de la plateforme (inscriptions,
 * signalements, décisions d'admin), du plus récent au plus ancien. Chaque ligne mène au dossier.
 */
export function AdminRecentActivity() {
  const activity = useAdminActivity(RECENT_ACTIVITY_LIMIT);
  const now = new Date();

  return (
    <AdminPanel
      icon={Clock}
      title="Activité récente"
      description="Les dernières actions sur la plateforme."
    >
      {activity.isPending && (
        <div
          role="status"
          aria-label="Chargement de l’activité"
          className="flex flex-col gap-3 p-5"
        >
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      )}
      {activity.isError && (
        <p role="alert" className="m-5 rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger l’activité récente.
        </p>
      )}
      {activity.isSuccess && activity.data.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-primary">
            <History className="size-6" aria-hidden />
          </span>
          <p className="font-display text-xl font-semibold">Aucune activité récente</p>
          <p className="text-muted-foreground">
            Les inscriptions et signalements apparaîtront ici.
          </p>
        </div>
      )}
      {activity.isSuccess && activity.data.length > 0 && (
        <ol aria-label="Derniers événements" className="divide-y">
          {activity.data.map((item) => {
            const { icon: Icon, title, description } = describeActivity(item);
            const content = (
              <>
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"
                >
                  <Icon className="size-6" strokeWidth={1.6} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold sm:text-[17px]">{title}</span>
                  <span
                    className="truncate text-sm text-muted-foreground sm:text-[15px]"
                    title={description}
                  >
                    {description}
                  </span>
                </span>
                <time
                  dateTime={item.at}
                  title={formatDateTime(item.at)}
                  className="shrink-0 pt-0.5 text-[13px] whitespace-nowrap text-muted-foreground sm:text-sm"
                >
                  {formatTimeAgo(item.at, now)}
                </time>
              </>
            );
            const rowClass = 'flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5';
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    to={item.href}
                    className={`${rowClass} transition-colors outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </AdminPanel>
  );
}
