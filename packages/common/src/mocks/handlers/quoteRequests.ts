import { delay, http, HttpResponse } from 'msw';
import {
  canChangeQuoteRequestStatus,
  canSendQuoteRequest,
  computeQuoteRequestExpiresAt,
} from '../../rules';
import { createQuoteRequestInputSchema, declineQuoteRequestInputSchema } from '../../schemas';
import type { Conversation, QuoteRequest, QuoteRequestStatus } from '../../types';
import { expireStaleQuoteRequests, postMessage } from '../conversations';
import type { MockDb } from '../db';
import { toQuoteRequestDetails, toQuoteRequestSummary } from '../mappers';
import { apiError, currentUser, invalidInput } from './http';

/** Le code HTTP renvoyé pour chaque refus de la règle canSendQuoteRequest. */
const DENIAL_STATUS = {
  client_inactive: 403,
  own_provider: 403,
  provider_not_public: 409,
  date_in_past: 422,
  date_too_far: 422,
  provider_unavailable: 409,
} as const;

/** Demandes de devis, côté client (C1, C2, C3) et côté prestataire (S3). Lot 4. */
export function quoteRequestHandlers(db: MockDb) {
  /** La demande et le rôle de l'utilisateur connecté vis-à-vis d'elle. */
  function findForUser(requestId: string, userId: string) {
    const request = db.data.quoteRequests.find((r) => r.id === requestId);
    if (!request) return undefined;
    const provider = db.data.providers.find((p) => p.id === request.providerId)!;
    const side =
      request.clientId === userId ? 'client' : provider.userId === userId ? 'provider' : undefined;
    return side ? { request, side } : undefined;
  }

  /** Change le statut d'une demande et prévient dans la conversation. */
  function changeStatus(
    request: QuoteRequest,
    to: QuoteRequestStatus,
    authorId: string,
    systemMessage: string,
  ) {
    const now = db.now().toISOString();
    request.status = to;
    request.updatedAt = now;
    const conversation = db.data.conversations.find((c) => c.quoteRequestId === request.id)!;
    postMessage(db, conversation, authorId, systemMessage, 'system');
    db.save();
  }

  return [
    http.post('*/api/quote-requests', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');

      const parsed = createQuoteRequestInputSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!parsed.success) return invalidInput(parsed.error);
      const input = parsed.data;

      const provider = db.data.providers.find((p) => p.id === input.providerId);
      if (!provider) return apiError(404, 'provider_not_found', 'Prestataire introuvable.');

      const now = db.now();
      const verdict = canSendQuoteRequest({
        client: user,
        provider: {
          ...provider,
          unavailabilities: db.data.unavailabilities.filter((u) => u.providerId === provider.id),
        },
        eventDate: input.eventDate,
        today: now.toISOString().slice(0, 10),
      });
      if (!verdict.allowed) {
        return apiError(DENIAL_STATUS[verdict.reason], verdict.reason, verdict.message);
      }

      const created = db.update(() => {
        const at = now.toISOString();
        const quoteRequest: QuoteRequest = {
          id: db.newId('qr'),
          clientId: user.id,
          ...input,
          status: 'pending',
          expiresAt: computeQuoteRequestExpiresAt(now),
          createdAt: at,
          updatedAt: at,
        };
        const conversation: Conversation = {
          id: db.newId('conv'),
          quoteRequestId: quoteRequest.id,
          clientId: user.id,
          providerUserId: provider.userId,
          lastMessageAt: at,
          unreadCountClient: 0,
          unreadCountProvider: 0,
          createdAt: at,
          updatedAt: at,
        };
        db.data.quoteRequests.push(quoteRequest);
        db.data.conversations.push(conversation);
        // Le message de la demande ouvre la conversation (et passe par le masquage).
        postMessage(db, conversation, user.id, input.message);
        return quoteRequest;
      });
      return HttpResponse.json(created, { status: 201 });
    }),

    http.get('*/api/quote-requests', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      expireStaleQuoteRequests(db);

      const side = new URL(request.url).searchParams.get('side') ?? 'client';
      const myProviderIds = new Set(
        db.data.providers.filter((p) => p.userId === user.id).map((p) => p.id),
      );
      const requests = db.data.quoteRequests
        .filter((r) =>
          side === 'provider' ? myProviderIds.has(r.providerId) : r.clientId === user.id,
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return HttpResponse.json(requests.map((r) => toQuoteRequestSummary(db.data, r)));
    }),

    http.get('*/api/quote-requests/:requestId', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      expireStaleQuoteRequests(db);

      const found = findForUser(String(params.requestId), user.id);
      // 404 aussi quand la demande existe mais n'est pas à toi : on ne dit pas qu'elle existe.
      if (!found) return apiError(404, 'quote_request_not_found', 'Demande introuvable.');
      return HttpResponse.json(toQuoteRequestDetails(db.data, found.request));
    }),

    http.post('*/api/quote-requests/:requestId/decline', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');

      const found = findForUser(String(params.requestId), user.id);
      if (!found) return apiError(404, 'quote_request_not_found', 'Demande introuvable.');
      if (found.side !== 'provider') {
        return apiError(403, 'forbidden', 'Seul le prestataire peut décliner une demande.');
      }
      const parsed = declineQuoteRequestInputSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!parsed.success) return invalidInput(parsed.error);
      if (!canChangeQuoteRequestStatus(found.request.status, 'declined')) {
        return apiError(409, 'invalid_status', 'Cette demande ne peut plus être déclinée.');
      }

      found.request.declineReason = parsed.data.reason;
      changeStatus(
        found.request,
        'declined',
        user.id,
        `Demande déclinée par le prestataire. Motif : ${parsed.data.reason}`,
      );
      return HttpResponse.json(found.request);
    }),

    http.post('*/api/quote-requests/:requestId/cancel', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');

      const found = findForUser(String(params.requestId), user.id);
      if (!found) return apiError(404, 'quote_request_not_found', 'Demande introuvable.');
      if (found.side !== 'client') {
        return apiError(403, 'forbidden', 'Seul le client peut annuler sa demande.');
      }
      if (!canChangeQuoteRequestStatus(found.request.status, 'cancelled')) {
        return apiError(409, 'invalid_status', 'Cette demande ne peut plus être annulée.');
      }

      changeStatus(found.request, 'cancelled', user.id, 'Demande annulée par le client.');
      return HttpResponse.json(found.request);
    }),
  ];
}
