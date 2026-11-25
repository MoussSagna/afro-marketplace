import type { Booking } from '@afro/common';
import i18n from 'i18next';
import type { StatusTone } from '../messaging/requestStatus';

/** Une réservation encore devant nous : confirmée (ou payée, plus tard avec Stripe). */
const UPCOMING: ReadonlyArray<Booking['status']> = ['confirmed', 'deposit_paid', 'fully_paid'];

/** L'onglet d'une réservation (C5) : « À venir » ou « Passées » (annulées comprises). */
export function isUpcomingBooking(booking: Pick<Booking, 'status'>): boolean {
  return UPCOMING.includes(booking.status);
}

/**
 * Peut-on encore annuler ? Seulement une réservation confirmée, et avant le jour J
 * (mêmes règles que le serveur, qui refuse sinon).
 * `today` : le jour actuel, « 2026-11-25 ».
 */
export function canCancelBooking(
  booking: Pick<Booking, 'status' | 'eventDate'>,
  today: string,
): boolean {
  return booking.status === 'confirmed' && booking.eventDate > today;
}

/** Le badge d'une réservation : son libellé, traduit, et sa couleur. */
export function bookingStatus(booking: Pick<Booking, 'status'>): {
  label: string;
  tone: StatusTone;
} {
  const label = i18n.t(`bookingStatus.${booking.status}`);
  switch (booking.status) {
    case 'confirmed':
    case 'deposit_paid':
    case 'fully_paid':
      return { label, tone: 'success' };
    case 'disputed':
      return { label, tone: 'warning' };
    default:
      return { label, tone: 'muted' };
  }
}
