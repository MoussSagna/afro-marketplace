import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createHttpApiClient } from '../../api';
import { MASKED_CONTACT_PLACEHOLDER } from '../../rules';
import type { CreateQuoteRequestInput } from '../../types';
import { addDays, toIsoDate } from '../../utils/dates';
import { handlers, mockDb } from '..';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockDb.reset());
afterAll(() => server.close());

/** Un client d'API connecté avec un compte de démo. */
const as = (userId: string) => createHttpApiClient({ getToken: () => `demo:${userId}` });
const client = as('user-aissatou');
const pro = as('user-saveurs-de-dakar');

const today = () => toIsoDate(mockDb.now());
const tantie = () => mockDb.data.providers.find((p) => p.slug === 'chez-tantie-adjoua')!;
const saveurs = () => mockDb.data.providers.find((p) => p.slug === 'saveurs-de-dakar')!;

function input(overrides: Partial<CreateQuoteRequestInput> = {}): CreateQuoteRequestInput {
  return {
    providerId: tantie().id,
    clientType: 'individual',
    eventType: 'birthday',
    eventDate: addDays(today(), 40),
    eventCity: 'Créteil',
    eventPostalCode: '94000',
    guestCount: 60,
    message:
      'Bonjour, je fête mes 40 ans et voudrais un buffet ivoirien. Mon numéro : 06 12 34 56 78',
    ...overrides,
  };
}

describe('API des demandes de devis (mockée)', () => {
  it('crée la demande, sa conversation et un premier message masqué', async () => {
    const created = await client.createQuoteRequest(input());
    expect(created.status).toBe('pending');
    expect(created.clientId).toBe('user-aissatou');

    const details = await client.getQuoteRequest(created.id);
    const messages = await client.listMessages(details.conversationId);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.body).toContain(MASKED_CONTACT_PLACEHOLDER);
    expect(messages[0]!.body).not.toContain('06 12');
    expect(messages[0]!.hasMaskedContent).toBe(true);
  });

  it('exige d’être connecté', async () => {
    await expect(createHttpApiClient().createQuoteRequest(input())).rejects.toMatchObject({
      status: 401,
    });
  });

  it('refuse un formulaire invalide avec le message Zod', async () => {
    await expect(client.createQuoteRequest(input({ message: 'Trop court' }))).rejects.toMatchObject(
      { status: 400, code: 'invalid_input' },
    );
  });

  it('règle n° 4 : un prestataire ne peut pas se demander un devis à lui-même', async () => {
    await expect(pro.createQuoteRequest(input({ providerId: saveurs().id }))).rejects.toMatchObject(
      { status: 403, code: 'own_provider' },
    );
  });

  it('règle n° 3 : refuse une date bloquée par le prestataire', async () => {
    const date = addDays(today(), 40);
    mockDb.update((data) => {
      data.unavailabilities.push({
        id: 'unav-test',
        providerId: tantie().id,
        date,
        reason: 'manual',
        createdAt: mockDb.now().toISOString(),
        updatedAt: mockDb.now().toISOString(),
      });
    });
    await expect(client.createQuoteRequest(input({ eventDate: date }))).rejects.toMatchObject({
      status: 409,
      code: 'provider_unavailable',
    });
  });

  it('liste les demandes de chaque côté, sans mélanger', async () => {
    const mine = await client.listQuoteRequests('client');
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((s) => s.request.clientId === 'user-aissatou')).toBe(true);

    const received = await pro.listQuoteRequests('provider');
    expect(received.every((s) => s.provider.slug === 'saveurs-de-dakar')).toBe(true);
  });

  it('cache la demande d’un autre (404)', async () => {
    const created = await client.createQuoteRequest(input());
    await expect(pro.getQuoteRequest(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it('le prestataire décline avec un motif, la conversation se ferme', async () => {
    const pending = (await pro.listQuoteRequests('provider')).find(
      (s) => s.request.status === 'pending',
    )!;
    const declined = await pro.declineQuoteRequest(pending.request.id, {
      reason: 'Déjà complet ce week-end',
    });
    expect(declined.status).toBe('declined');
    expect(declined.declineReason).toBe('Déjà complet ce week-end');

    const messages = await pro.listMessages(pending.conversationId);
    expect(messages.at(-1)).toMatchObject({ kind: 'system' });
    expect(messages.at(-1)!.body).toContain('Déjà complet');

    await expect(
      client.sendMessage(pending.conversationId, { body: 'Dommage !' }),
    ).rejects.toMatchObject({ status: 409, code: 'conversation_closed' });
    // Une demande déclinée ne peut plus l'être à nouveau.
    await expect(
      pro.declineQuoteRequest(pending.request.id, { reason: 'Encore' }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('seul le client annule, seul le prestataire décline', async () => {
    const created = await client.createQuoteRequest(input({ providerId: saveurs().id }));
    await expect(
      client.declineQuoteRequest(created.id, { reason: 'Je décline' }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(pro.cancelQuoteRequest(created.id)).rejects.toMatchObject({ status: 403 });
    expect((await client.cancelQuoteRequest(created.id)).status).toBe('cancelled');
  });

  it('expire une demande sans réponse au bout de 7 jours', async () => {
    const created = await client.createQuoteRequest(input());
    mockDb.update((data) => {
      data.quoteRequests.find((r) => r.id === created.id)!.expiresAt = new Date(
        mockDb.now().getTime() - 1000,
      ).toISOString();
    });
    const details = await client.getQuoteRequest(created.id);
    expect(details.request.status).toBe('expired');
  });
});
