import { delay, http, HttpResponse } from 'msw';
import { computeCancellationRefund } from '../../rules';
import { cancelBookingInputSchema, updateProviderProfileInputSchema } from '../../schemas';
import type { Unavailability, User } from '../../types';
import { formatPrice } from '../../utils/formatPrice';
import { completePastBookings, toBookingSummary } from '../bookings';
import { expireStaleQuoteRequests, postMessage } from '../conversations';
import type { MockDb } from '../db';
import { toQuoteRequestSummary } from '../mappers';
import { apiError, currentUser, invalidInput } from './http';

/**
 * Réservations (C5 / S2), tableau de bord (S2), agenda (S6) et réglages du
 * profil prestataire connecté. Lot 5.
 */
export function bookingHandlers(db: MockDb) {
  const myProvider = (user: User) => db.data.providers.find((p) => p.userId === user.id);
  const today = () => db.now().toISOString().slice(0, 10);

  return [
    http.get('*/api/bookings', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      completePastBookings(db);

      const side = new URL(request.url).searchParams.get('side') ?? 'client';
      const providerId = myProvider(user)?.id;
      const bookings = db.data.bookings
        .filter((b) => (side === 'provider' ? b.providerId === providerId : b.clientId === user.id))
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
      return HttpResponse.json(bookings.map((b) => toBookingSummary(db.data, b)));
    }),

    http.post('*/api/bookings/:bookingId/cancel', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      const booking = db.data.bookings.find((b) => b.id === params.bookingId);
      const isClient = booking?.clientId === user.id;
      const isProvider = booking !== undefined && booking.providerId === myProvider(user)?.id;
      if (!booking || (!isClient && !isProvider)) {
        return apiError(404, 'booking_not_found', 'Réservation introuvable.');
      }
      const parsed = cancelBookingInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      if (booking.status !== 'confirmed' || booking.eventDate <= today()) {
        return apiError(409, 'invalid_status', 'Cette réservation ne peut plus être annulée.');
      }

      db.update((data) => {
        const cancelledBy = isClient ? 'client' : 'provider';
        const at = db.now().toISOString();
        Object.assign(booking, {
          status: 'cancelled',
          cancelledBy,
          cancelReason: parsed.data.reason,
          cancelledAt: at,
          updatedAt: at,
        });
        // La date redevient libre dans l'agenda du prestataire.
        data.unavailabilities = data.unavailabilities.filter((u) => u.bookingId !== booking.id);

        // Règle n° 9 : en mode « offline », on AFFICHE ce que prévoit la politique, sur l'acompte.
        const refund = computeCancellationRefund({
          policy: booking.cancellationPolicy,
          amountPaid: booking.depositAmount,
          eventDate: booking.eventDate,
          cancelledOn: today(),
          cancelledBy,
        });
        const who = isClient ? 'le client' : 'le prestataire';
        const conversation = data.conversations.find(
          (c) => c.quoteRequestId === booking.quoteRequestId,
        )!;
        postMessage(
          db,
          conversation,
          user.id,
          `Réservation annulée par ${who}. Motif : ${parsed.data.reason}. ` +
            `Selon les conditions, ${refund.refundPercent} % de l’acompte est à rembourser (${formatPrice(refund.refundAmount)}).`,
          'system',
        );
      });
      return HttpResponse.json(booking);
    }),

    http.get('*/api/me/provider/dashboard', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return apiError(403, 'not_provider', 'Réservé aux prestataires.');
      expireStaleQuoteRequests(db);
      completePastBookings(db);

      const requests = db.data.quoteRequests
        .filter((r) => r.providerId === provider.id)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const upcoming = db.data.bookings
        .filter((b) => b.providerId === provider.id && b.status === 'confirmed')
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
      return HttpResponse.json({
        pendingRequestsCount: requests.filter((r) => r.status === 'pending').length,
        upcomingBookingsCount: upcoming.length,
        ratingAverage: provider.ratingAverage,
        ratingCount: provider.ratingCount,
        recentRequests: requests.slice(0, 5).map((r) => toQuoteRequestSummary(db.data, r)),
        upcomingBookings: upcoming.slice(0, 5).map((b) => toBookingSummary(db.data, b)),
      });
    }),

    http.get('*/api/me/provider/unavailabilities', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return apiError(403, 'not_provider', 'Réservé aux prestataires.');
      const url = new URL(request.url);
      const from = url.searchParams.get('from') ?? '0000-01-01';
      const to = url.searchParams.get('to') ?? '9999-12-31';
      return HttpResponse.json(
        db.data.unavailabilities
          .filter((u) => u.providerId === provider.id && u.date >= from && u.date <= to)
          .sort((a, b) => a.date.localeCompare(b.date)),
      );
    }),

    http.post('*/api/me/provider/unavailabilities', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return apiError(403, 'not_provider', 'Réservé aux prestataires.');
      const body = (await request.json().catch(() => null)) as { date?: unknown } | null;
      const date = typeof body?.date === 'string' ? body.date : '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return apiError(400, 'invalid_input', 'Date invalide.');
      }
      if (date < today()) return apiError(422, 'date_in_past', 'Cette date est déjà passée.');
      const existing = db.data.unavailabilities.filter(
        (u) => u.providerId === provider.id && u.date === date,
      );
      if (existing.some((u) => u.reason === 'manual')) {
        return apiError(409, 'already_blocked', 'Cette date est déjà bloquée.');
      }

      const created = db.update((data) => {
        const at = db.now().toISOString();
        const unavailability: Unavailability = {
          id: db.newId('unav'),
          providerId: provider.id,
          date,
          reason: 'manual',
          createdAt: at,
          updatedAt: at,
        };
        data.unavailabilities.push(unavailability);
        return unavailability;
      });
      return HttpResponse.json(created, { status: 201 });
    }),

    http.delete('*/api/me/provider/unavailabilities/:id', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return apiError(403, 'not_provider', 'Réservé aux prestataires.');
      const target = db.data.unavailabilities.find(
        (u) => u.id === params.id && u.providerId === provider.id,
      );
      if (!target) return apiError(404, 'not_found', 'Date introuvable.');
      // Une date prise par une réservation se libère en annulant la réservation, pas ici.
      if (target.reason !== 'manual') {
        return apiError(
          409,
          'booked_date',
          'Cette date est réservée : annule la réservation pour la libérer.',
        );
      }
      db.update((data) => {
        data.unavailabilities = data.unavailabilities.filter((u) => u.id !== target.id);
      });
      return new HttpResponse(null, { status: 204 });
    }),

    http.get('*/api/me/provider', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider)
        return apiError(404, 'no_provider_profile', 'Pas encore de profil prestataire.');
      return HttpResponse.json({
        profile: provider,
        offerings: db.data.offerings.filter((o) => o.providerId === provider.id),
        media: db.data.media
          .filter((m) => m.providerId === provider.id)
          .sort((a, b) => a.order - b.order),
      });
    }),

    http.patch('*/api/me/provider', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider)
        return apiError(404, 'no_provider_profile', 'Pas encore de profil prestataire.');
      const parsed = updateProviderProfileInputSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!parsed.success) return invalidInput(parsed.error);
      db.update(() => {
        Object.assign(provider, parsed.data, { updatedAt: db.now().toISOString() });
      });
      return HttpResponse.json(provider);
    }),
  ];
}
