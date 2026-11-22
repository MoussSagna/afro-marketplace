import { delay, http, HttpResponse } from 'msw';
import {
  acceptQuote,
  canAcceptQuote,
  canChangeQuoteRequestStatus,
  computeQuoteTotal,
  nextQuoteVersion,
} from '../../rules';
import { acceptQuoteInputSchema, createQuoteInputSchema } from '../../schemas';
import type { Quote } from '../../types';
import { formatPrice } from '../../utils/formatPrice';
import { postMessage } from '../conversations';
import type { MockDb } from '../db';
import { apiError, currentUser, invalidInput } from './http';

/** Devis : création (S4), acceptation (règle n° 5) et refus par le client (C3). Lot 5. */
export function quoteHandlers(db: MockDb) {
  const conversationOf = (quoteRequestId: string) =>
    db.data.conversations.find((c) => c.quoteRequestId === quoteRequestId)!;

  /** Le devis, sa demande et son prestataire. */
  function findQuote(quoteId: string) {
    const quote = db.data.quotes.find((q) => q.id === quoteId);
    if (!quote) return undefined;
    const request = db.data.quoteRequests.find((r) => r.id === quote.quoteRequestId)!;
    const provider = db.data.providers.find((p) => p.id === request.providerId)!;
    return { quote, request, provider };
  }

  return [
    http.post('*/api/quotes', async ({ request: httpRequest }) => {
      await delay();
      const user = currentUser(db, httpRequest);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      const parsed = createQuoteInputSchema.safeParse(await httpRequest.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      const input = parsed.data;

      const request = db.data.quoteRequests.find((r) => r.id === input.quoteRequestId);
      const provider = request && db.data.providers.find((p) => p.id === request.providerId);
      if (!request || provider?.userId !== user.id) {
        return apiError(404, 'quote_request_not_found', 'Demande introuvable.');
      }
      // Un devis sur une demande en attente (1re version) ou déjà chiffrée (nouvelle version).
      if (request.status !== 'pending' && request.status !== 'quoted') {
        return apiError(409, 'invalid_status', 'Cette demande n’accepte plus de devis.');
      }
      const today = db.now().toISOString().slice(0, 10);
      if (input.validUntil < today) {
        return apiError(422, 'invalid_valid_until', 'La date de validité est déjà passée.');
      }

      const quote = db.update((data) => {
        const at = db.now().toISOString();
        const existing = data.quotes.filter((q) => q.quoteRequestId === request.id);
        // Une nouvelle version remplace la précédente encore ouverte.
        for (const previous of existing) {
          if (previous.status === 'sent') {
            previous.status = 'superseded';
            previous.updatedAt = at;
          }
        }
        const id = db.newId('quote');
        const created: Quote = {
          id,
          quoteRequestId: request.id,
          version: nextQuoteVersion(existing),
          lines: input.lines.map((line) => ({ ...line, id: db.newId('line'), quoteId: id })),
          // Le total est TOUJOURS recalculé côté serveur, jamais repris du formulaire.
          totalAmount: computeQuoteTotal(input.lines),
          depositRate: input.depositRate,
          validUntil: input.validUntil,
          conditions: input.conditions || undefined,
          status: 'sent',
          createdAt: at,
          updatedAt: at,
        };
        data.quotes.push(created);
        if (canChangeQuoteRequestStatus(request.status, 'quoted')) {
          request.status = 'quoted';
        }
        request.updatedAt = at;
        postMessage(
          db,
          conversationOf(request.id),
          user.id,
          `Devis n° ${created.version} envoyé : ${formatPrice(created.totalAmount)}`,
          'system',
        );
        return created;
      });
      return HttpResponse.json(quote, { status: 201 });
    }),

    http.post('*/api/quotes/:quoteId/accept', async ({ params, request: httpRequest }) => {
      await delay();
      const user = currentUser(db, httpRequest);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      const found = findQuote(String(params.quoteId));
      if (!found || found.request.clientId !== user.id) {
        return apiError(404, 'quote_not_found', 'Devis introuvable.');
      }
      const parsed = acceptQuoteInputSchema.safeParse(await httpRequest.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);

      const now = db.now();
      const verdict = canAcceptQuote({
        userId: user.id,
        quote: found.quote,
        request: found.request,
        provider: {
          ...found.provider,
          unavailabilities: db.data.unavailabilities.filter(
            (u) => u.providerId === found.provider.id,
          ),
        },
        today: now.toISOString().slice(0, 10),
      });
      if (!verdict.allowed) return apiError(409, verdict.reason, verdict.message);

      const booking = db.update((data) => {
        const result = acceptQuote({
          quote: found.quote,
          quotes: data.quotes.filter((q) => q.quoteRequestId === found.request.id),
          request: found.request,
          provider: found.provider,
          eventAddress: parsed.data.eventAddress,
          now,
          newId: (prefix) => db.newId(prefix),
        });
        // On enregistre tout ensemble (le vrai back-end le fera dans une transaction).
        data.quotes = data.quotes.map((q) => result.quotes.find((u) => u.id === q.id) ?? q);
        Object.assign(found.request, result.request);
        data.bookings.push(result.booking);
        data.unavailabilities.push(result.unavailability);
        postMessage(db, conversationOf(found.request.id), user.id, result.systemMessage, 'system');
        return result.booking;
      });
      return HttpResponse.json(booking, { status: 201 });
    }),

    http.post('*/api/quotes/:quoteId/decline', async ({ params, request: httpRequest }) => {
      await delay();
      const user = currentUser(db, httpRequest);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      const found = findQuote(String(params.quoteId));
      if (!found || found.request.clientId !== user.id) {
        return apiError(404, 'quote_not_found', 'Devis introuvable.');
      }
      if (found.quote.status !== 'sent') {
        return apiError(409, 'quote_not_sent', 'Ce devis n’attend plus de réponse.');
      }
      db.update(() => {
        found.quote.status = 'declined';
        found.quote.updatedAt = db.now().toISOString();
        // La demande reste ouverte : le prestataire peut proposer une nouvelle version.
        postMessage(
          db,
          conversationOf(found.request.id),
          user.id,
          `Devis n° ${found.quote.version} refusé par le client. Le prestataire peut proposer une nouvelle version.`,
          'system',
        );
      });
      return HttpResponse.json(found.quote);
    }),
  ];
}
