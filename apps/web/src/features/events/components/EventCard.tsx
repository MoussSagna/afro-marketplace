import type { EventSummary } from '@afro/common';
import { CalendarDays, ChevronRight, FileText, MapPin, UserRound, Users } from 'lucide-react';
import { Link } from 'react-router';
import { EVENT_TYPE_PHOTOS, formatEventDay, plural } from '../lib/eventDisplay';
import { EventStatusBadge } from './EventBadges';

/** Une carte de « Mes événements » : photo, nom, statut, date, ville, invités, compteurs. */
export function EventCard({ summary }: { summary: EventSummary }) {
  const { event, status, counts } = summary;
  return (
    <Link
      to={`/evenements/${event.id}`}
      className="group flex items-center gap-3.5 rounded-2xl border bg-card p-3 shadow-card transition-[border-color,translate] duration-200 outline-none hover:-translate-y-0.5 hover:border-primary/25 focus-visible:ring-[3px] focus-visible:ring-ring motion-reduce:transition-none sm:gap-6 sm:p-4 sm:pr-5"
    >
      <img
        src={EVENT_TYPE_PHOTOS[event.type]}
        alt=""
        loading="lazy"
        className="size-[88px] shrink-0 self-start rounded-xl object-cover sm:h-[108px] sm:w-[150px] sm:self-center"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-2.5">
        <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3.5">
          <h2 className="text-[17px] leading-tight font-bold sm:text-[22px]">{event.name}</h2>
          <EventStatusBadge status={status} />
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] sm:gap-x-5 sm:text-[15px]">
          <li className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-primary" aria-hidden />
            {formatEventDay(event.date)}
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin className="size-4 text-primary" aria-hidden />
            {event.city}
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="size-4 text-primary" aria-hidden />
            {plural(event.guestCount, 'invité')}
          </li>
        </ul>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-muted-foreground sm:gap-x-5 sm:text-[15px]">
          <li className="flex items-center gap-1.5">
            <UserRound className="size-4 text-primary" aria-hidden />
            {plural(counts.providers, 'prestataire')}
          </li>
          <li className="flex items-center gap-1.5">
            <FileText className="size-4 text-primary" aria-hidden />
            {counts.received} devis {counts.received > 1 ? 'reçus' : 'reçu'}
          </li>
        </ul>
      </div>
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted transition-transform group-hover:translate-x-0.5 sm:size-10"
      >
        <ChevronRight className="size-5" />
      </span>
    </Link>
  );
}
