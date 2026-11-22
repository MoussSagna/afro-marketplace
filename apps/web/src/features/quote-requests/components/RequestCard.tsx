import {
  EVENT_TYPE_LABELS,
  formatEventDate,
  type QuoteRequestSummary,
  type Side,
} from '@afro/common';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RequestStatusBadge } from './RequestStatusBadge';

/** Une demande dans une liste (C2 / S3). Toute la carte est cliquable. */
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

  return (
    <article className="relative flex gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-card">
      <Avatar className="size-12">
        {image && <AvatarImage src={image} alt="" />}
        <AvatarFallback>{title.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-sans text-base font-semibold">
            <Link to={to} className="after:absolute after:inset-0">
              {title}
            </Link>
          </h3>
          <RequestStatusBadge request={request} side={side} />
        </div>
        <p className="text-sm font-medium">{EVENT_TYPE_LABELS[request.eventType]}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-1">
            <CalendarDays className="size-4" aria-hidden />
            {formatEventDate(request.eventDate)}
          </li>
          <li className="flex items-center gap-1">
            <MapPin className="size-4" aria-hidden />
            {request.eventCity}
          </li>
          {request.guestCount && (
            <li className="flex items-center gap-1">
              <Users className="size-4" aria-hidden />
              {request.guestCount} invités
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}
