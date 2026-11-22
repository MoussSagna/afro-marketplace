import { toIsoDate, useBookings } from '@afro/common';
import { CalendarCheck } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { BookingCard } from '../components/BookingCard';

/** C5 : les réservations du client, à venir puis passées. */
export function BookingsPage() {
  const bookings = useBookings('client');
  usePageMeta('Mes réservations');
  const today = toIsoDate(new Date());

  if (bookings.isPending) return <Skeleton className="h-40 rounded-xl" aria-label="Chargement" />;
  if (bookings.isError) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
        Impossible de charger les réservations.
      </p>
    );
  }

  const upcoming = bookings.data.filter(
    (b) => b.booking.status === 'confirmed' && b.booking.eventDate >= today,
  );
  const past = bookings.data
    .filter((b) => !upcoming.includes(b))
    .sort((a, b) => b.booking.eventDate.localeCompare(a.booking.eventDate));

  return (
    <section aria-labelledby="bookings-title" className="flex flex-col gap-8">
      <h1 id="bookings-title" className="text-3xl font-semibold">
        Mes réservations
      </h1>
      {bookings.data.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Pas encore de réservation"
          description="Une réservation est créée quand tu acceptes le devis d’un prestataire."
          action={
            <Button asChild>
              <Link to="/espace/demandes">Voir mes demandes</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div aria-labelledby="upcoming-title" role="region">
            <h2 id="upcoming-title" className="mb-3 text-xl font-semibold">
              À venir ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground">Aucune réservation à venir.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {upcoming.map((summary) => (
                  <li key={summary.booking.id}>
                    <BookingCard summary={summary} side="client" />
                  </li>
                ))}
              </ul>
            )}
          </div>
          {past.length > 0 && (
            <div aria-labelledby="past-title" role="region">
              <h2 id="past-title" className="mb-3 text-xl font-semibold">
                Passées et annulées ({past.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {past.map((summary) => (
                  <li key={summary.booking.id}>
                    <BookingCard summary={summary} side="client" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
