import { describe, expect, it } from 'vitest';
import { canReviewBooking, computeProviderRating } from './review';

const booking = { id: 'book-1', clientId: 'user-aissatou', status: 'completed' as const };

describe('règle n° 6 : canReviewBooking', () => {
  it('autorise le client d’une réservation terminée', () => {
    expect(canReviewBooking({ booking, userId: 'user-aissatou', existingReviews: [] })).toEqual({
      allowed: true,
    });
  });

  it('refuse quelqu’un d’autre que le client (même le prestataire)', () => {
    expect(
      canReviewBooking({ booking, userId: 'user-mamadou', existingReviews: [] }),
    ).toMatchObject({ allowed: false, reason: 'not_your_booking' });
  });

  it.each(['confirmed', 'deposit_paid', 'fully_paid', 'cancelled', 'disputed'] as const)(
    'refuse une réservation « %s »',
    (status) => {
      expect(
        canReviewBooking({
          booking: { ...booking, status },
          userId: 'user-aissatou',
          existingReviews: [],
        }),
      ).toMatchObject({ allowed: false, reason: 'booking_not_completed' });
    },
  );

  it('refuse un deuxième avis sur la même réservation', () => {
    expect(
      canReviewBooking({
        booking,
        userId: 'user-aissatou',
        existingReviews: [{ bookingId: 'book-1' }],
      }),
    ).toMatchObject({ allowed: false, reason: 'already_reviewed' });
  });

  it('ignore les avis laissés sur d’autres réservations', () => {
    expect(
      canReviewBooking({
        booking,
        userId: 'user-aissatou',
        existingReviews: [{ bookingId: 'book-2' }],
      }).allowed,
    ).toBe(true);
  });
});

describe('règle n° 8 : computeProviderRating', () => {
  it('calcule la moyenne et le nombre d’avis', () => {
    expect(
      computeProviderRating([
        { rating: 5, status: 'published' },
        { rating: 4, status: 'published' },
      ]),
    ).toEqual({ ratingAverage: 4.5, ratingCount: 2 });
  });

  it('arrondit à une décimale', () => {
    expect(
      computeProviderRating([
        { rating: 5, status: 'published' },
        { rating: 5, status: 'published' },
        { rating: 4, status: 'published' },
      ]).ratingAverage,
    ).toBe(4.7); // 4,666…
  });

  it('ne compte pas les avis masqués par la modération', () => {
    expect(
      computeProviderRating([
        { rating: 5, status: 'published' },
        { rating: 1, status: 'hidden' },
      ]),
    ).toEqual({ ratingAverage: 5, ratingCount: 1 });
  });

  it('vaut 0 sans avis publié', () => {
    expect(computeProviderRating([])).toEqual({ ratingAverage: 0, ratingCount: 0 });
    expect(computeProviderRating([{ rating: 3, status: 'hidden' }])).toEqual({
      ratingAverage: 0,
      ratingCount: 0,
    });
  });
});
