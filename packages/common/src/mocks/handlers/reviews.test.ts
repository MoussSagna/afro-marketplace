import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, createHttpApiClient } from '../../api';
import { handlers, mockDb } from '..';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockDb.reset());
afterAll(() => server.close());

const as = (userId: string) => createHttpApiClient({ getToken: () => `demo:${userId}` });
const client = as('user-aissatou');

/** Scénario de démo n° 4 : la réservation terminée chez Douceurs Créoles, sans avis. */
async function completedBooking() {
  const bookings = await client.listBookings('client');
  return bookings.find((s) => s.booking.status === 'completed' && !s.review)!;
}

const proOf = (providerId: string) =>
  as(mockDb.data.providers.find((p) => p.id === providerId)!.userId);

async function errorOf(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

describe('API des avis (mockée)', () => {
  it('la cliente laisse un avis : publié, note du prestataire recalculée (règle n° 8)', async () => {
    const { booking, provider } = await completedBooking();
    const before = mockDb.data.providers.find((p) => p.id === provider.id)!;
    const { ratingCount } = before;

    const review = await client.createReview({
      bookingId: booking.id,
      rating: 1,
      subRatings: { quality: 1, punctuality: 2, value: 1 },
      comment: 'Gâteau arrivé en retard.',
    });
    expect(review).toMatchObject({ status: 'published', rating: 1, authorId: 'user-aissatou' });

    const after = mockDb.data.providers.find((p) => p.id === provider.id)!;
    expect(after.ratingCount).toBe(ratingCount + 1);
    const published = mockDb.data.reviews.filter(
      (r) => r.providerId === provider.id && r.status === 'published',
    );
    const expected = published.reduce((sum, r) => sum + r.rating, 0) / published.length;
    expect(after.ratingAverage).toBe(Math.round(expected * 10) / 10);

    // La réservation porte maintenant son avis : plus de bouton.
    const again = (await client.listBookings('client')).find((s) => s.booking.id === booking.id)!;
    expect(again.review?.id).toBe(review.id);
  });

  it('un seul avis par réservation (règle n° 6)', async () => {
    const { booking } = await completedBooking();
    await client.createReview({ bookingId: booking.id, rating: 5 });
    const error = await errorOf(client.createReview({ bookingId: booking.id, rating: 4 }));
    expect(error).toMatchObject({ status: 409, code: 'already_reviewed' });
  });

  it('pas d’avis sur une réservation à venir, ni sur celle d’un autre', async () => {
    const bookings = await client.listBookings('client');
    const upcoming = bookings.find((s) => s.booking.status === 'confirmed')!;
    const notDone = await errorOf(
      client.createReview({ bookingId: upcoming.booking.id, rating: 5 }),
    );
    expect(notDone).toMatchObject({ status: 409, code: 'booking_not_completed' });

    const { booking } = await completedBooking();
    const notMine = await errorOf(
      as('user-kevin').createReview({ bookingId: booking.id, rating: 5 }),
    );
    expect(notMine).toMatchObject({ status: 403, code: 'not_your_booking' });
  });

  it('le prestataire répond une seule fois, et lui seul', async () => {
    const { booking, provider } = await completedBooking();
    const review = await client.createReview({ bookingId: booking.id, rating: 4 });
    const pro = proOf(provider.id);

    const outsider = await errorOf(
      as('user-saveurs-de-dakar').replyToReview(review.id, { reply: 'Merci !' }),
    );
    expect(outsider.status).toBe(404);

    const replied = await pro.replyToReview(review.id, { reply: 'Merci pour votre confiance !' });
    expect(replied.providerReply).toBe('Merci pour votre confiance !');
    expect(replied.providerRepliedAt).toBeDefined();

    const twice = await errorOf(pro.replyToReview(review.id, { reply: 'Encore merci' }));
    expect(twice).toMatchObject({ status: 409, code: 'already_replied' });

    // La réponse apparaît sur le profil public.
    const publicReviews = await client.listProviderReviews(provider.id);
    expect(publicReviews.find((r) => r.id === review.id)?.providerReply).toBe(
      'Merci pour votre confiance !',
    );
  });

  it('S8 : le prestataire liste ses avis reçus, les plus récents d’abord', async () => {
    const pro = as('user-saveurs-de-dakar');
    const reviews = await pro.listMyReviews();
    const providerId = mockDb.data.providers.find((p) => p.userId === 'user-saveurs-de-dakar')!.id;
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews.every((r) => r.providerId === providerId)).toBe(true);
    const dates = reviews.map((r) => r.createdAt);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(reviews[0]!.author.firstName).toBeTruthy();

    const error = await errorOf(client.listMyReviews());
    expect(error.status).toBe(403);
  });
});
