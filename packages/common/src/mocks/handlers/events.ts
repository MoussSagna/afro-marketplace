import { delay, http, HttpResponse } from 'msw';
import type { z } from 'zod';
import {
  budgetRangeOf,
  buildEventQuoteMessage,
  canRequestEventQuote,
  canRetainEventProvider,
  computeEventProviderStatus,
  computeEventStatus,
  countEventProviders,
  isValidEventDate,
  toQuoteEventType,
} from '../../rules';
import {
  addEventProviderInputSchema,
  eventInputSchema,
  eventMessages,
  requestEventQuotesInputSchema,
  setEventProviderRetainedInputSchema,
} from '../../schemas';
import type {
  EventDetails,
  EventProvider,
  EventSummary,
  PlannedEvent,
  RequestEventQuotesResult,
  User,
} from '../../types';
import { expireStaleQuoteRequests } from '../conversations';
import type { MockDb } from '../db';
import { toProviderCard } from '../mappers';
import { apiError, currentUser, invalidInput } from './http';
import { sendQuoteRequest } from './quoteRequests';

/**
 * Planificateur d'événements (page « Événements », 27/11/2026).
 * Un événement n'est visible que par le client qui l'a créé. Les statuts des prestataires sont
 * calculés à partir des vraies demandes de devis ; « Demander les devis » crée une demande par
 * prestataire avec les règles habituelles (canSendQuoteRequest).
 */
export function eventHandlers(db: MockDb) {
  const today = () => db.now().toISOString().slice(0, 10);

  /** L'événement, s'il existe et appartient à l'utilisateur (supprimé : seulement si `withDeleted`). */
  function ownEvent(user: User, eventId: unknown, withDeleted = false) {
    return db.data.events.find(
      (e) => e.id === eventId && e.clientId === user.id && (withDeleted || !e.deletedAt),
    );
  }
  const notFound = () => apiError(404, 'event_not_found', 'Événement introuvable.');
  const linksOf = (eventId: string) => db.data.eventProviders.filter((l) => l.eventId === eventId);

  function statusOf(link: EventProvider) {
    const request = db.data.quoteRequests.find((r) => r.id === link.quoteRequestId);
    return computeEventProviderStatus({
      retained: link.retained,
      quoteRequestStatus: request?.status,
    });
  }

  function toSummary(event: PlannedEvent): EventSummary {
    const links = linksOf(event.id);
    const statuses = links.map(statusOf);
    return {
      event,
      providerIds: links.map((l) => l.providerId),
      status: computeEventStatus(event, statuses, today()),
      counts: countEventProviders(statuses),
    };
  }

  function toDetails(event: PlannedEvent): EventDetails {
    const providers = linksOf(event.id).flatMap((link) => {
      const profile = db.data.providers.find((p) => p.id === link.providerId);
      return profile ? [{ link, status: statusOf(link), provider: toProviderCard(profile) }] : [];
    });
    return { ...toSummary(event), providers };
  }

  /** Lit le corps de la requête avec un schéma ; renvoie la réponse d'erreur si c'est invalide. */
  async function parseBody<S extends z.ZodType>(
    request: Request,
    schema: S,
  ): Promise<{ data: z.output<S>; error?: undefined } | { data?: undefined; error: Response }> {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    return parsed.success ? { data: parsed.data } : { error: invalidInput(parsed.error) };
  }

  const authError = () => apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');

  return [
    http.get('*/api/events', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return authError();
      expireStaleQuoteRequests(db);
      const events = db.data.events
        .filter((e) => e.clientId === user.id && !e.deletedAt)
        .sort((a, b) => a.date.localeCompare(b.date));
      return HttpResponse.json(events.map(toSummary));
    }),

    http.get('*/api/events/:eventId', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return authError();
      expireStaleQuoteRequests(db);
      const event = ownEvent(user, params.eventId);
      return event ? HttpResponse.json(toDetails(event)) : notFound();
    }),

    http.post('*/api/events', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return authError();
      const body = await parseBody(request, eventInputSchema);
      if (body.error) return body.error;
      const input = body.data;
      if (!isValidEventDate(input.date, today())) {
        return apiError(422, 'date_in_past', eventMessages.dateInPast);
      }
      const created = db.update(() => {
        const at = db.now().toISOString();
        const event: PlannedEvent = {
          id: db.newId('evt'),
          clientId: user.id,
          ...input,
          description: input.description ?? '',
          createdAt: at,
          updatedAt: at,
        };
        db.data.events.push(event);
        return event;
      });
      return HttpResponse.json(created, { status: 201 });
    }),

    http.put('*/api/events/:eventId', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return authError();
      const event = ownEvent(user, params.eventId);
      if (!event) return notFound();
      const body = await parseBody(request, eventInputSchema);
      if (body.error) return body.error;
      const input = body.data;
      // Une date déjà passée peut rester telle quelle (événement passé qu'on renomme, par exemple).
      if (input.date !== event.date && !isValidEventDate(input.date, today())) {
        return apiError(422, 'date_in_past', eventMessages.dateInPast);
      }
      db.update(() => {
        const { budget, ...rest } = input;
        Object.assign(event, rest, {
          description: input.description ?? '',
          updatedAt: db.now().toISOString(),
        });
        if (budget) event.budget = budget;
        else delete event.budget;
      });
      return HttpResponse.json(event);
    }),

    // Suppression « douce » : l'événement et ses prestataires peuvent être restaurés (« Annuler »).
    // Les demandes de devis déjà envoyées ne changent pas : les prestataires ne sont pas prévenus.
    http.delete('*/api/events/:eventId', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return authError();
      const event = ownEvent(user, params.eventId);
      if (!event) return notFound();
      db.update(() => {
        event.deletedAt = db.now().toISOString();
      });
      return new HttpResponse(null, { status: 204 });
    }),

    http.post('*/api/events/:eventId/restore', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return authError();
      const event = ownEvent(user, params.eventId, true);
      if (!event) return notFound();
      db.update(() => {
        delete event.deletedAt;
      });
      return HttpResponse.json(event);
    }),

    http.post('*/api/events/:eventId/providers', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return authError();
      const event = ownEvent(user, params.eventId);
      if (!event) return notFound();
      const body = await parseBody(request, addEventProviderInputSchema);
      if (body.error) return body.error;
      const profile = db.data.providers.find((p) => p.id === body.data.providerId);
      if (!profile || profile.status !== 'published') {
        return apiError(404, 'provider_not_found', 'Prestataire introuvable.');
      }
      if (profile.userId === user.id) {
        return apiError(
          403,
          'own_provider',
          'Tu ne peux pas ajouter ton propre profil prestataire.',
        );
      }
      // Pas de doublon dans un même événement.
      if (linksOf(event.id).some((l) => l.providerId === profile.id)) {
        return apiError(409, 'already_added', 'Ce prestataire est déjà dans l’événement.');
      }
      const link = db.update(() => {
        const at = db.now().toISOString();
        const created: EventProvider = {
          id: db.newId('evp'),
          eventId: event.id,
          providerId: profile.id,
          retained: false,
          createdAt: at,
          updatedAt: at,
        };
        db.data.eventProviders.push(created);
        return created;
      });
      return HttpResponse.json(link, { status: 201 });
    }),

    // Retirer un prestataire : seule l'association disparaît. Une demande déjà envoyée reste
    // dans « Mes demandes » et la messagerie.
    http.delete('*/api/events/:eventId/providers/:providerId', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return authError();
      const event = ownEvent(user, params.eventId);
      if (!event) return notFound();
      const link = linksOf(event.id).find((l) => l.providerId === params.providerId);
      if (!link)
        return apiError(
          404,
          'event_provider_not_found',
          'Ce prestataire n’est pas dans l’événement.',
        );
      db.update((data) => {
        data.eventProviders = data.eventProviders.filter((l) => l !== link);
      });
      return new HttpResponse(null, { status: 204 });
    }),

    // Demander les devis en une fois : une vraie demande par prestataire (mêmes règles que C1).
    http.post('*/api/events/:eventId/quote-requests', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return authError();
      expireStaleQuoteRequests(db);
      const event = ownEvent(user, params.eventId);
      if (!event) return notFound();
      const body = await parseBody(request, requestEventQuotesInputSchema);
      if (body.error) return body.error;

      const result: RequestEventQuotesResult = { sent: [], failed: [] };
      const message = buildEventQuoteMessage(event, body.data.message);
      for (const providerId of new Set(body.data.providerIds)) {
        const link = linksOf(event.id).find((l) => l.providerId === providerId);
        if (!link) {
          result.failed.push({
            providerId,
            code: 'not_in_event',
            message: 'Ce prestataire n’est pas dans l’événement.',
          });
          continue;
        }
        if (!canRequestEventQuote(statusOf(link))) {
          result.failed.push({
            providerId,
            code: 'already_requested',
            message: 'Une demande de devis est déjà en cours.',
          });
          continue;
        }
        const sent = sendQuoteRequest(db, user, {
          providerId,
          clientType: 'individual',
          eventType: toQuoteEventType(event.type),
          eventDate: event.date,
          eventCity: event.city,
          eventPostalCode: event.postalCode,
          guestCount: event.guestCount,
          ...budgetRangeOf(event.budget),
          message,
        });
        if (!sent.ok) {
          result.failed.push({ providerId, code: sent.code, message: sent.message });
          continue;
        }
        db.update(() => {
          Object.assign(link, {
            quoteRequestId: sent.request.id,
            retained: false,
            updatedAt: db.now().toISOString(),
          });
        });
        result.sent.push({ providerId, quoteRequestId: sent.request.id });
      }
      return HttpResponse.json(result);
    }),

    // Retenir un prestataire (après son devis), ou ne plus le retenir. Ce n'est pas une réservation.
    http.put(
      '*/api/events/:eventId/providers/:providerId/retained',
      async ({ params, request }) => {
        await delay();
        const user = currentUser(db, request);
        if (!user) return authError();
        expireStaleQuoteRequests(db);
        const event = ownEvent(user, params.eventId);
        if (!event) return notFound();
        const link = linksOf(event.id).find((l) => l.providerId === params.providerId);
        if (!link)
          return apiError(
            404,
            'event_provider_not_found',
            'Ce prestataire n’est pas dans l’événement.',
          );
        const body = await parseBody(request, setEventProviderRetainedInputSchema);
        if (body.error) return body.error;
        const verdict = canRetainEventProvider(statusOf(link));
        if (!verdict.allowed) return apiError(422, verdict.reason, verdict.message);
        db.update(() => {
          Object.assign(link, { retained: body.data.retained, updatedAt: db.now().toISOString() });
        });
        return HttpResponse.json(link);
      },
    ),
  ];
}
