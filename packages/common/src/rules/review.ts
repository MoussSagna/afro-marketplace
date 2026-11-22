import type { Booking, Review } from '../types';
import { allow, deny, type RuleResult } from './ruleResult';

export type ReviewDenial = 'not_your_booking' | 'booking_not_completed' | 'already_reviewed';

/**
 * Règle n° 6 : un avis n'est possible que
 * - par le client de la réservation,
 * - sur une réservation terminée (« completed »),
 * - une seule fois.
 * Sert à afficher (ou non) le bouton « Laisser un avis ».
 */
export function canReviewBooking({
  booking,
  userId,
  existingReviews,
}: {
  booking: Pick<Booking, 'id' | 'clientId' | 'status'>;
  userId: string;
  existingReviews: ReadonlyArray<Pick<Review, 'bookingId'>>;
}): RuleResult<ReviewDenial> {
  if (booking.clientId !== userId) {
    return deny('not_your_booking', 'Seul le client de cette réservation peut laisser un avis.');
  }
  if (booking.status !== 'completed') {
    return deny('booking_not_completed', 'Tu pourras laisser un avis après l’événement.');
  }
  if (existingReviews.some((r) => r.bookingId === booking.id)) {
    return deny('already_reviewed', 'Tu as déjà laissé un avis pour cette réservation.');
  }
  return allow();
}

/**
 * Règle n° 8 : la note moyenne et le nombre d'avis d'un prestataire.
 * Seuls les avis publiés comptent (un avis masqué par la modération sort du calcul).
 * La moyenne est arrondie à 1 décimale (4,75 → 4,8). 0 avis → moyenne 0.
 */
export function computeProviderRating(reviews: ReadonlyArray<Pick<Review, 'rating' | 'status'>>): {
  ratingAverage: number;
  ratingCount: number;
} {
  const published = reviews.filter((r) => r.status === 'published');
  if (published.length === 0) return { ratingAverage: 0, ratingCount: 0 };

  const sum = published.reduce((total, r) => total + r.rating, 0);
  return {
    ratingAverage: Math.round((sum / published.length) * 10) / 10,
    ratingCount: published.length,
  };
}
