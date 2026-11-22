import { delay, http, HttpResponse } from 'msw';
import { canReviewBooking, computeProviderRating } from '../../rules';
import { createReviewInputSchema, replyToReviewInputSchema } from '../../schemas';
import type { Review } from '../../types';
import { completePastBookings } from '../bookings';
import type { MockDb } from '../db';
import { toPublicUser } from '../mappers';
import { apiError, currentUser, invalidInput } from './http';

/**
 * Avis : laisser un avis (C6), y répondre et lister les avis reçus (S8). Lot 6.
 * Le signalement d'un avis passe par POST /reports (messaging.ts).
 */
export function reviewHandlers(db: MockDb) {
  /** Règle n° 8 : après chaque avis, la note du prestataire est recalculée. */
  function refreshRating(providerId: string) {
    const provider = db.data.providers.find((p) => p.id === providerId);
    if (!provider) return;
    Object.assign(
      provider,
      computeProviderRating(db.data.reviews.filter((r) => r.providerId === providerId)),
    );
  }

  return [
    http.post('*/api/reviews', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      const parsed = createReviewInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);

      completePastBookings(db);
      const booking = db.data.bookings.find((b) => b.id === parsed.data.bookingId);
      if (!booking) return apiError(404, 'booking_not_found', 'Réservation introuvable.');

      // Règle n° 6 : la même fonction décide d'afficher le bouton ET d'accepter l'avis.
      const verdict = canReviewBooking({
        booking,
        userId: user.id,
        existingReviews: db.data.reviews,
      });
      if (!verdict.allowed) {
        const status = verdict.reason === 'not_your_booking' ? 403 : 409;
        return apiError(status, verdict.reason, verdict.message);
      }

      const review = db.update((data) => {
        const at = db.now().toISOString();
        const created: Review = {
          id: db.newId('rev'),
          bookingId: booking.id,
          authorId: user.id,
          providerId: booking.providerId,
          rating: parsed.data.rating,
          ...(parsed.data.subRatings && { subRatings: parsed.data.subRatings }),
          ...(parsed.data.comment && { comment: parsed.data.comment }),
          status: 'published',
          createdAt: at,
          updatedAt: at,
        };
        data.reviews.push(created);
        refreshRating(booking.providerId);
        return created;
      });
      return HttpResponse.json(review, { status: 201 });
    }),

    http.post('*/api/reviews/:reviewId/reply', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      const review = db.data.reviews.find((r) => r.id === params.reviewId);
      const provider = db.data.providers.find((p) => p.userId === user.id);
      if (!review || review.providerId !== provider?.id) {
        return apiError(404, 'review_not_found', 'Avis introuvable.');
      }
      const parsed = replyToReviewInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      // Une seule réponse publique : elle ne se modifie pas.
      if (review.providerReply) {
        return apiError(409, 'already_replied', 'Tu as déjà répondu à cet avis.');
      }

      db.update(() => {
        const at = db.now().toISOString();
        Object.assign(review, {
          providerReply: parsed.data.reply,
          providerRepliedAt: at,
          updatedAt: at,
        });
      });
      return HttpResponse.json(review);
    }),

    http.get('*/api/me/provider/reviews', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && db.data.providers.find((p) => p.userId === user.id);
      if (!provider) return apiError(403, 'not_provider', 'Réservé aux prestataires.');
      const reviews = db.data.reviews
        .filter((r) => r.providerId === provider.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((review) => {
          const author = db.data.users.find((u) => u.id === review.authorId)!;
          return { ...review, author: toPublicUser(author) };
        });
      return HttpResponse.json(reviews);
    }),
  ];
}
