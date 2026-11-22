import {
  ApiError,
  CLIENT_TYPE_LABELS,
  EVENT_TYPE_LABELS,
  formatDateTime,
  formatEventDate,
  formatPrice,
  isQuoteRequestOpen,
  useProvider,
  useQuoteRequest,
  type QuoteRequestDetails,
  type Side,
} from '@afro/common';
import { ArrowLeft, FileText, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { BookingPanel } from '@/features/bookings/components/BookingPanel';
import { AcceptQuoteDialog } from '@/features/quotes/components/AcceptQuoteDialog';
import { DeclineQuoteButton } from '@/features/quotes/components/DeclineQuoteButton';
import { QuoteCard } from '@/features/quotes/components/QuoteCard';
import { CancelRequestDialog } from '../components/CancelRequestDialog';
import { DeclineDialog } from '../components/DeclineDialog';
import { RequestStatusBadge } from '../components/RequestStatusBadge';
import { SPACE_PATHS } from '../lib/spacePaths';

function budgetLabel({ budgetMin, budgetMax }: QuoteRequestDetails['request']) {
  if (budgetMin !== undefined && budgetMax !== undefined)
    return `${formatPrice(budgetMin)} à ${formatPrice(budgetMax)}`;
  if (budgetMax !== undefined) return `Jusqu’à ${formatPrice(budgetMax)}`;
  if (budgetMin !== undefined) return `À partir de ${formatPrice(budgetMin)}`;
  return 'Non précisé';
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

/** C3 (côté client) et S3 (côté prestataire) : le détail d'une demande et ses actions. */
export function RequestDetailPage({ side }: { side: Side }) {
  const { id = '' } = useParams();
  const details = useQuoteRequest(id);
  // Côté client, la politique d'annulation du prestataire s'affiche avant d'accepter un devis.
  const publicProfile = useProvider(side === 'client' ? (details.data?.provider.slug ?? '') : '');
  usePageMeta('Détail de la demande');
  const paths = SPACE_PATHS[side];

  if (details.isPending) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Chargement">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  if (details.isError) {
    if (details.error instanceof ApiError && details.error.status === 404) return <NotFoundPage />;
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
        Impossible de charger cette demande. Réessaie dans un instant.
      </p>
    );
  }

  const { request, provider, client, quotes, booking, conversationId } = details.data;
  const title =
    side === 'client' ? provider.displayName : `${client.firstName} ${client.lastNameInitial}`;
  const conversationUrl = `${paths.messages}/${conversationId}`;
  const isOpen = isQuoteRequestOpen(request.status);

  return (
    <article className="flex flex-col gap-6">
      <Link
        to={paths.requests}
        className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Toutes les demandes
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Demande du {formatDateTime(request.createdAt)}
          </p>
          <h1 className="text-3xl font-semibold">{title}</h1>
          {side === 'client' && (
            <Link
              to={`/prestataires/${provider.slug}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Voir le profil
            </Link>
          )}
        </div>
        <RequestStatusBadge request={request} side={side} className="text-sm" />
      </header>

      {request.status === 'declined' && request.declineReason && (
        <p className="rounded-lg bg-muted p-4 text-sm">
          <strong>Motif du refus :</strong> {request.declineReason}
        </p>
      )}
      {request.status === 'expired' && (
        <p className="rounded-lg bg-muted p-4 text-sm">
          Cette demande a expiré : le prestataire n’a pas répondu sous 7 jours.
        </p>
      )}

      <section aria-labelledby="event-title" className="rounded-xl border bg-card p-5">
        <h2 id="event-title" className="mb-4 text-xl font-semibold">
          L’événement
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Info label="Type">{EVENT_TYPE_LABELS[request.eventType]}</Info>
          <Info label="Date">{formatEventDate(request.eventDate)}</Info>
          <Info label="Lieu">
            {request.eventCity} ({request.eventPostalCode})
          </Info>
          <Info label="Invités">{request.guestCount ?? 'Non précisé'}</Info>
          <Info label="Budget">{budgetLabel(request)}</Info>
          <Info label="Organisé">{CLIENT_TYPE_LABELS[request.clientType]}</Info>
        </dl>
        <h3 className="mt-6 mb-2 font-sans text-sm text-muted-foreground">Message</h3>
        <p className="whitespace-pre-line">{request.message}</p>
      </section>

      {booking && <BookingPanel booking={booking} side={side} />}

      {quotes.length > 0 && (
        <section aria-labelledby="quotes-title" className="flex flex-col gap-3">
          <h2 id="quotes-title" className="text-xl font-semibold">
            Devis
          </h2>
          {/* La version la plus récente en premier. */}
          {[...quotes].reverse().map((quote) => (
            <QuoteCard key={quote.id} quote={quote}>
              {side === 'client' && quote.status === 'sent' && request.status === 'quoted' && (
                <>
                  {publicProfile.data ? (
                    <AcceptQuoteDialog
                      quote={quote}
                      cancellationPolicy={publicProfile.data.profile.cancellationPolicy}
                    />
                  ) : (
                    <Button disabled>Accepter le devis</Button>
                  )}
                  <DeclineQuoteButton quoteId={quote.id} />
                </>
              )}
            </QuoteCard>
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to={conversationUrl}>
            <MessageCircle aria-hidden />
            {side === 'provider' && request.status === 'pending'
              ? 'Poser une question'
              : 'Ouvrir la conversation'}
          </Link>
        </Button>
        {side === 'provider' && isOpen && (
          <Button asChild variant="outline">
            <Link to={`${paths.requests}/${request.id}/devis`}>
              <FileText aria-hidden />
              {quotes.length === 0 ? 'Envoyer un devis' : 'Nouvelle version du devis'}
            </Link>
          </Button>
        )}
        {side === 'provider' && request.status === 'pending' && (
          <DeclineDialog requestId={request.id} />
        )}
        {side === 'client' && isOpen && <CancelRequestDialog requestId={request.id} />}
      </div>
    </article>
  );
}
