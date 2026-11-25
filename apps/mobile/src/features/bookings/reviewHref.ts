import type { Href } from 'expo-router';

/** L'adresse de « Laisser un avis » sur une réservation (« /avis/book-12 »). L'écran arrive au lot M12. */
export function reviewHref(bookingId: string): Href {
  return { pathname: '/avis/[id]', params: { id: bookingId } };
}
