import {
  EVENT_TYPE_LABELS,
  formatEventDate,
  type QuoteRequestSummary,
  type Side,
} from '@afro/common';
import { BadgeCheck, CalendarDays, ChevronRight, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router';
import { RequestStatusBadge } from './RequestStatusBadge';

/**
 * Une demande dans une liste (C2 / S3). Toute la carte est cliquable : le lien est sur le nom
 * et son `::after` couvre la carte (un seul lien, lu une fois par le lecteur d'écran).
 *
 * - À gauche : la photo du prestataire (côté client) ou l'avatar du client (côté prestataire),
 *   sinon l'initiale.
 * - Au centre : le nom (+ badge vérifié), le type d'événement, la date, la ville, les invités.
 * - À droite : le statut et une flèche. Sur téléphone, le statut passe sous les infos.
 */
export function RequestCard({
  summary,
  side,
  to,
}: {
  summary: QuoteRequestSummary;
  side: Side;
  to: string;
}) {
  const { request, provider, client } = summary;
  // Le client voit le prestataire ; le prestataire voit le client.
  const title =
    side === 'client' ? provider.displayName : `${client.firstName} ${client.lastNameInitial}`;
  const image = side === 'client' ? provider.coverUrl : client.avatarUrl;
  const verified = side === 'client' && provider.isProVerified;

  return (
    <article className="group relative flex gap-4 rounded-2xl border bg-card p-3.5 shadow-card transition-[border-color,translate] duration-200 focus-within:ring-[3px] focus-within:ring-ring hover:-translate-y-px hover:border-primary/25 motion-reduce:transition-none sm:items-center sm:gap-7 sm:px-6 sm:py-4">
      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-24 sm:w-[116px]">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <span
            aria-hidden
            className="flex size-full items-center justify-center font-display text-2xl font-semibold text-primary"
          >
            {title.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-1.5">
        <h3 className="flex items-center gap-2 font-sans text-[17px] leading-snug font-semibold sm:text-[22px]">
          <Link to={to} className="outline-none after:absolute after:inset-0 after:rounded-2xl">
            {title}
          </Link>
          {verified && (
            <span title="Pro vérifié" className="inline-flex">
              <BadgeCheck
                aria-hidden
                className="size-5 fill-ochre text-white sm:size-6"
                strokeWidth={2.2}
              />
              <span className="sr-only">Pro vérifié</span>
            </span>
          )}
        </h3>
        <p className="text-[15px] sm:text-lg">{EVENT_TYPE_LABELS[request.eventType]}</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground/85 sm:gap-x-8 sm:text-base">
          <li className="flex items-center gap-1.5">
            <CalendarDays className="size-4 sm:size-5" aria-hidden />
            {formatEventDate(request.eventDate)}
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin className="size-4 sm:size-5" aria-hidden />
            {request.eventCity}
          </li>
          {request.guestCount && (
            <li className="flex items-center gap-1.5">
              <Users className="size-4 sm:size-5" aria-hidden />
              {request.guestCount} invités
            </li>
          )}
        </ul>
        <RequestStatusBadge
          request={request}
          side={side}
          size="lg"
          className="mt-1.5 self-start sm:hidden"
        />
      </div>

      <div className="hidden shrink-0 items-center gap-6 sm:flex">
        <RequestStatusBadge request={request} side={side} size="lg" />
        <span
          aria-hidden
          className="flex size-11 items-center justify-center rounded-full border bg-background text-foreground/80 transition-colors group-hover:border-primary/30 group-hover:text-primary"
        >
          <ChevronRight className="size-5" />
        </span>
      </div>
    </article>
  );
}
