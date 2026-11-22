import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createHttpApiClient } from '../../api';
import { addDays, toIsoDate } from '../../utils/dates';
import { handlers, mockDb } from '..';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockDb.reset());
afterAll(() => server.close());

const as = (userId: string) => createHttpApiClient({ getToken: () => `demo:${userId}` });
const client = as('user-aissatou');
const pro = as('user-saveurs-de-dakar');
const validUntil = () => addDays(toIsoDate(mockDb.now()), 14);

/** La demande de démo « en attente » d'Aïssatou chez Saveurs de Dakar. */
async function pendingRequest() {
  const list = await pro.listQuoteRequests('provider');
  return list.find(
    (s) => s.request.status === 'pending' && s.request.clientId === 'user-aissatou',
  )!;
}

async function sendQuote(quoteRequestId: string, unitPrice = 2800) {
  return pro.createQuote({
    quoteRequestId,
    lines: [
      { label: 'Buffet sénégalais', quantity: 150, unitPrice },
      { label: 'Service', quantity: 1, unitPrice: 30000 },
    ],
    depositRate: 30,
    validUntil: validUntil(),
  });
}

describe('API des devis et réservations (mockée)', () => {
  it('le prestataire envoie un devis : total recalculé, demande « quoted »', async () => {
    const { request, conversationId } = await pendingRequest();
    const quote = await sendQuote(request.id);
    expect(quote).toMatchObject({ version: 1, status: 'sent', totalAmount: 150 * 2800 + 30000 });
    expect((await client.getQuoteRequest(request.id)).request.status).toBe('quoted');
    const messages = await client.listMessages(conversationId);
    expect(messages.at(-1)).toMatchObject({ kind: 'system' });
    expect(messages.at(-1)!.body).toMatch(/^Devis n° 1 envoyé/);
  });

  it('une nouvelle version remplace la précédente', async () => {
    const { request } = await pendingRequest();
    await sendQuote(request.id);
    const v2 = await sendQuote(request.id, 2500);
    expect(v2.version).toBe(2);
    const { quotes } = await client.getQuoteRequest(request.id);
    expect(quotes.map((q) => q.status)).toEqual(['superseded', 'sent']);
  });

  it('seul le prestataire concerné peut chiffrer la demande', async () => {
    const { request } = await pendingRequest();
    await expect(
      as('user-admin').createQuote({
        quoteRequestId: request.id,
        lines: [{ label: 'Buffet', quantity: 1, unitPrice: 100 }],
        depositRate: 30,
        validUntil: validUntil(),
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('règle n° 5 : accepter crée la réservation, bloque la date et lève le masquage', async () => {
    const { request, conversationId } = await pendingRequest();
    const quote = await sendQuote(request.id);
    const booking = await client.acceptQuote(quote.id, {
      eventAddress: '12 rue des Fêtes, 94000 Créteil',
    });

    expect(booking).toMatchObject({
      status: 'confirmed',
      eventDate: request.eventDate,
      depositAmount: Math.round(quote.totalAmount * 0.3),
    });
    const details = await client.getQuoteRequest(request.id);
    expect(details.request.status).toBe('accepted');
    expect(details.booking?.id).toBe(booking.id);

    // La date est bloquée dans l'agenda du prestataire.
    const agenda = await pro.listMyUnavailabilities({
      from: request.eventDate,
      to: request.eventDate,
    });
    expect(agenda).toContainEqual(
      expect.objectContaining({ reason: 'booking', bookingId: booking.id }),
    );

    // Les coordonnées passent désormais.
    const message = await pro.sendMessage(conversationId, { body: 'Mon numéro : 06 11 22 33 44' });
    expect(message).toMatchObject({ hasMaskedContent: false, body: 'Mon numéro : 06 11 22 33 44' });

    // Et on ne peut pas accepter deux fois.
    await expect(
      client.acceptQuote(quote.id, { eventAddress: '12 rue des Fêtes' }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('le client peut refuser un devis ; la demande reste ouverte', async () => {
    const { request } = await pendingRequest();
    const quote = await sendQuote(request.id);
    expect((await client.declineQuote(quote.id)).status).toBe('declined');
    expect((await client.getQuoteRequest(request.id)).request.status).toBe('quoted');
  });

  it('annuler une réservation libère la date et affiche le remboursement prévu', async () => {
    const { request, conversationId } = await pendingRequest();
    const quote = await sendQuote(request.id);
    const booking = await client.acceptQuote(quote.id, {
      eventAddress: '12 rue des Fêtes, Créteil',
    });

    const cancelled = await client.cancelBooking(booking.id, { reason: 'Mariage reporté' });
    expect(cancelled).toMatchObject({ status: 'cancelled', cancelledBy: 'client' });
    const agenda = await pro.listMyUnavailabilities({
      from: request.eventDate,
      to: request.eventDate,
    });
    expect(agenda.some((u) => u.bookingId === booking.id)).toBe(false);
    const last = (await client.listMessages(conversationId)).at(-1)!;
    expect(last.body).toMatch(/Réservation annulée par le client.*% de l’acompte/);
  });

  it('liste les réservations de chaque côté et passe les dates passées en « completed »', async () => {
    const mine = await client.listBookings('client');
    expect(mine.every((b) => b.booking.clientId === 'user-aissatou')).toBe(true);
    const today = toIsoDate(mockDb.now());
    expect(
      mine
        .filter((b) => b.booking.eventDate < today)
        .every((b) => b.booking.status !== 'confirmed'),
    ).toBe(true);
  });

  it('donne le tableau de bord du prestataire', async () => {
    const dashboard = await pro.getProviderDashboard();
    expect(dashboard.pendingRequestsCount).toBeGreaterThan(0);
    expect(dashboard.recentRequests.length).toBeLessThanOrEqual(5);
    expect(dashboard.ratingCount).toBeGreaterThan(0);
    await expect(client.getProviderDashboard()).rejects.toMatchObject({ status: 403 });
  });

  it('agenda : bloquer puis débloquer une date', async () => {
    const date = addDays(toIsoDate(mockDb.now()), 200);
    const blocked = await pro.blockDate(date);
    expect(blocked).toMatchObject({ date, reason: 'manual' });
    await expect(pro.blockDate(date)).rejects.toMatchObject({ status: 409 });
    expect((await pro.listMyUnavailabilities({ from: date, to: date })).map((u) => u.id)).toEqual([
      blocked.id,
    ]);
    await pro.unblockDate(blocked.id);
    expect(await pro.listMyUnavailabilities({ from: date, to: date })).toEqual([]);
  });

  it('réglage « max par jour » du profil', async () => {
    const updated = await pro.updateMyProviderProfile({ maxBookingsPerDay: 2 });
    expect(updated.maxBookingsPerDay).toBe(2);
    expect((await pro.getMyProviderProfile()).profile.maxBookingsPerDay).toBe(2);
  });
});
