import { describeCancellationPolicy, formatPrice, type Booking, type Side } from '@afro/common';
import { CheckCircle2 } from 'lucide-react';
import { CancelBookingDialog } from './CancelBookingDialog';

const STATUS_LABELS: Record<Booking['status'], string> = {
  confirmed: 'Réservation confirmée',
  deposit_paid: 'Acompte payé',
  fully_paid: 'Payée',
  completed: 'Prestation terminée',
  cancelled: 'Réservation annulée',
  disputed: 'Litige en cours',
};

/** Le bloc « Réservation » du détail d'une demande : adresse révélée, montants, annulation. */
export function BookingPanel({ booking, side }: { booking: Booking; side: Side }) {
  const isCancelled = booking.status === 'cancelled';
  return (
    <section
      aria-labelledby="booking-title"
      className={
        isCancelled
          ? 'rounded-xl border bg-muted p-5'
          : 'rounded-xl border border-success/30 bg-success-muted p-5'
      }
    >
      <h2 id="booking-title" className="flex items-center gap-2 text-xl font-semibold">
        {!isCancelled && <CheckCircle2 className="size-5 text-success" aria-hidden />}
        {STATUS_LABELS[booking.status]}
      </h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Adresse de l’événement</dt>
          <dd className="font-medium">{booking.eventAddress}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Montant</dt>
          <dd className="font-medium">
            {formatPrice(booking.totalAmount)} (acompte {formatPrice(booking.depositAmount)})
          </dd>
        </div>
      </dl>
      {isCancelled ? (
        booking.cancelReason && (
          <p className="mt-3 text-sm">
            Annulée par {booking.cancelledBy === 'client' ? 'le client' : 'le prestataire'} :{' '}
            {booking.cancelReason}
          </p>
        )
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            Paiement hors plateforme pour le moment : l’acompte se règle directement au prestataire.
            Les coordonnées sont désormais visibles dans la conversation.
          </p>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium">Conditions d’annulation</summary>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {describeCancellationPolicy(booking.cancellationPolicy).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </details>
          {booking.status === 'confirmed' && (
            <div className="mt-3">
              <CancelBookingDialog booking={booking} side={side} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
