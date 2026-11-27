import type { BookingSummary } from '@afro/common';

/**
 * Les réservations à venir : confirmées et pas encore passées (`today` au format ISO `AAAA-MM-JJ`).
 * Une seule définition pour la page « Réservations » (C5) et la carte du tableau de bord client.
 */
export function upcomingBookings<T extends Pick<BookingSummary, 'booking'>>(
  bookings: T[],
  today: string,
): T[] {
  return bookings.filter((b) => b.booking.status === 'confirmed' && b.booking.eventDate >= today);
}
