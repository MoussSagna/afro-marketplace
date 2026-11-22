import { useProviderDashboard } from '@afro/common';
import { CalendarCheck, FileText, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { BookingCard } from '@/features/bookings/components/BookingCard';
import { ProfileStatusBanner } from '@/features/provider-onboarding/components/ProfileStatusBanner';
import { RequestCard } from '@/features/quote-requests/components/RequestCard';
import { useSessionStore } from '@/stores/session';

function StatTile({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card transition-colors hover:bg-muted"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="font-display text-3xl font-bold tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </span>
    </Link>
  );
}

/** S2 : le tableau de bord du prestataire. 3 chiffres simples et les listes récentes. */
export function DashboardPage() {
  const dashboard = useProviderDashboard();
  const firstName = useSessionStore((state) => state.user?.firstName);
  usePageMeta('Tableau de bord');

  return (
    <section aria-labelledby="dashboard-title" className="flex flex-col gap-8">
      <div>
        <h1 id="dashboard-title" className="text-3xl font-semibold">
          Tableau de bord
        </h1>
        {firstName && <p className="mt-1 text-muted-foreground">Bonjour {firstName} !</p>}
      </div>
      <ProfileStatusBanner />

      {dashboard.isPending && (
        <Skeleton className="h-28 rounded-xl" role="status" aria-label="Chargement" />
      )}
      {dashboard.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger le tableau de bord.
        </p>
      )}
      {dashboard.isSuccess && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              icon={FileText}
              label="demandes à traiter"
              value={String(dashboard.data.pendingRequestsCount)}
              to="/pro/demandes"
            />
            <StatTile
              icon={CalendarCheck}
              label="réservations à venir"
              value={String(dashboard.data.upcomingBookingsCount)}
              to="/pro/agenda"
            />
            <StatTile
              icon={Star}
              label={`note moyenne (${dashboard.data.ratingCount} avis)`}
              value={dashboard.data.ratingAverage.toLocaleString('fr-FR', {
                maximumFractionDigits: 1,
              })}
              to="/pro/avis"
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div role="region" aria-labelledby="recent-title">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="recent-title" className="text-xl font-semibold">
                  Demandes récentes
                </h2>
                <Link to="/pro/demandes" className="text-sm text-primary hover:underline">
                  Tout voir
                </Link>
              </div>
              {dashboard.data.recentRequests.length === 0 ? (
                <p className="text-muted-foreground">Pas encore de demande.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {dashboard.data.recentRequests.map((summary) => (
                    <li key={summary.request.id}>
                      <RequestCard
                        summary={summary}
                        side="provider"
                        to={`/pro/demandes/${summary.request.id}`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div role="region" aria-labelledby="upcoming-title">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="upcoming-title" className="text-xl font-semibold">
                  Prochaines dates
                </h2>
                <Link to="/pro/agenda" className="text-sm text-primary hover:underline">
                  Agenda
                </Link>
              </div>
              {dashboard.data.upcomingBookings.length === 0 ? (
                <p className="text-muted-foreground">Aucune réservation à venir.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {dashboard.data.upcomingBookings.map((summary) => (
                    <li key={summary.booking.id}>
                      <BookingCard summary={summary} side="provider" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
