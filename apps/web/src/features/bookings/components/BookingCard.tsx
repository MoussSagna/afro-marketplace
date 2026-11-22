import { formatEventDate, formatPrice, type BookingSummary, type Side } from '@afro/common';
import { CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { SPACE_PATHS } from '@/features/quote-requests/lib/spacePaths';

const STATUS: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmée', className: 'bg-success-muted text-success' },
  completed: { label: 'Terminée', className: 'bg-secondary text-muted-foreground' },
  cancelled: { label: 'Annulée', className: 'bg-secondary text-muted-foreground' },
};

/** Une réservation dans une liste. Le lien mène à la demande, qui porte tout le détail. */
export function BookingCard({ summary, side }: { summary: BookingSummary; side: Side }) {
  const { booking, provider, client } = summary;
  const title =
    side === 'client' ? provider.displayName : `${client.firstName} ${client.lastNameInitial}`;
  const status = STATUS[booking.status] ?? STATUS.confirmed!;
  return (
    <article className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-card">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="font-sans text-base font-semibold">
          <Link
            to={`${SPACE_PATHS[side].requests}/${booking.quoteRequestId}`}
            className="after:absolute after:inset-0"
          >
            {title}
          </Link>
        </h3>
        <p className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-4" aria-hidden />
            {formatEventDate(booking.eventDate)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-4" aria-hidden />
            {booking.eventAddress}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold tabular-nums">{formatPrice(booking.totalAmount)}</span>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', status.className)}>
          {status.label}
        </span>
      </div>
    </article>
  );
}
