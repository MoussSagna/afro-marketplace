import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, createHttpApiClient } from '../../api';
import { addDays } from '../../utils/dates';
import { handlers, mockDb } from '..';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockDb.reset());
afterAll(() => server.close());

const as = (userId: string) => createHttpApiClient({ getToken: () => `demo:${userId}` });
const aissatou = as('user-aissatou');
const today = () => mockDb.now().toISOString().slice(0, 10);
const providerId = (slug: string) => mockDb.data.providers.find((p) => p.slug === slug)!.id;

async function errorOf(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

const input = () => ({
  type: 'birthday' as const,
  name: 'Anniversaire de Moussa',
  date: addDays(today(), 60),
  city: 'Montreuil',
  postalCode: '93100',
  guestCount: 60,
  budget: '3000_5000' as const,
  description: 'Soirée surprise.',
});

describe('Événements : lecture', () => {
  it('réservé au client connecté, et à ses propres événements', async () => {
    expect((await errorOf(createHttpApiClient().listEvents())).status).toBe(401);
    expect(await as('user-ibrahim').listEvents()).toEqual([]);
    expect((await errorOf(as('user-ibrahim').getEvent('evt-mariage-aissatou'))).status).toBe(404);
  });

  it('« Mes événements » : le seed, triés par date, statuts et compteurs calculés', async () => {
    const events = await aissatou.listEvents();
    expect(events.map((e) => e.event.name)).toEqual(['Mariage de Aïssatou', 'Anniversaire 30 ans']);
    expect(events[0]).toMatchObject({
      status: 'preparation',
      counts: { providers: 4, requested: 2, received: 1, retained: 0 },
    });
    expect(events[1]).toMatchObject({
      status: 'preparation',
      counts: { providers: 3, requested: 0 },
    });
  });

  it('détail : les statuts viennent des vraies demandes de devis', async () => {
    const details = await aissatou.getEvent('evt-mariage-aissatou');
    const status = Object.fromEntries(details.providers.map((p) => [p.provider.slug, p.status]));
    expect(status).toEqual({
      'saveurs-de-dakar': 'requested',
      'compagnie-akwaba': 'received',
      'wax-and-wedding-deco': 'added',
      'studio-sankofa': 'added',
    });
  });
});

describe('Événements : créer, modifier, supprimer, restaurer', () => {
  it('crée, modifie puis supprime avec annulation', async () => {
    const created = await aissatou.createEvent(input());
    expect(created).toMatchObject({ clientId: 'user-aissatou', name: 'Anniversaire de Moussa' });
    expect((await aissatou.listEvents()).map((e) => e.event.id)).toContain(created.id);

    const updated = await aissatou.updateEvent(created.id, {
      ...input(),
      name: 'Les 40 ans de Moussa',
      budget: undefined,
    });
    expect(updated.name).toBe('Les 40 ans de Moussa');
    expect(updated.budget).toBeUndefined();

    await aissatou.deleteEvent(created.id);
    expect((await aissatou.listEvents()).map((e) => e.event.id)).not.toContain(created.id);
    expect((await errorOf(aissatou.getEvent(created.id))).status).toBe(404);

    await aissatou.restoreEvent(created.id);
    expect((await aissatou.getEvent(created.id)).event.name).toBe('Les 40 ans de Moussa');
  });

  it('refuse un formulaire invalide et une date passée', async () => {
    const tooShort = await errorOf(aissatou.createEvent({ ...input(), name: 'A' }));
    expect(tooShort).toMatchObject({
      status: 400,
      message: 'Donne un nom à ton événement (3 caractères minimum)',
    });
    const past = await errorOf(aissatou.createEvent({ ...input(), date: addDays(today(), -1) }));
    expect(past).toMatchObject({ status: 422, code: 'date_in_past' });
    const guests = await errorOf(aissatou.createEvent({ ...input(), guestCount: 0 }));
    expect(guests.message).toBe('Entre 1 et 5 000 invités');
  });

  it('supprimer garde les demandes de devis déjà envoyées', async () => {
    const before = mockDb.data.quoteRequests.length;
    await aissatou.deleteEvent('evt-mariage-aissatou');
    expect(mockDb.data.quoteRequests.length).toBe(before);
    expect(
      mockDb.data.eventProviders.filter((l) => l.eventId === 'evt-mariage-aissatou'),
    ).toHaveLength(4);
  });
});

describe('Événements : prestataires', () => {
  it('ajoute sans doublon, retire seulement l’association', async () => {
    const id = providerId('glow-by-aminata');
    await aissatou.addEventProvider('evt-mariage-aissatou', id);
    const duplicate = await errorOf(aissatou.addEventProvider('evt-mariage-aissatou', id));
    expect(duplicate).toMatchObject({ status: 409, code: 'already_added' });
    expect((await aissatou.getEvent('evt-mariage-aissatou')).counts.providers).toBe(5);

    const requests = mockDb.data.quoteRequests.length;
    await aissatou.removeEventProvider('evt-mariage-aissatou', providerId('saveurs-de-dakar'));
    expect((await aissatou.getEvent('evt-mariage-aissatou')).counts.providers).toBe(4);
    expect(mockDb.data.quoteRequests.length).toBe(requests);
  });

  it('refuse un prestataire non publié', async () => {
    const pending = mockDb.data.providers.find((p) => p.status === 'pending_review')!;
    expect(
      (await errorOf(aissatou.addEventProvider('evt-mariage-aissatou', pending.id))).status,
    ).toBe(404);
  });

  it('demander les devis crée une vraie demande par prestataire', async () => {
    const before = mockDb.data.quoteRequests.length;
    const result = await aissatou.requestEventQuotes('evt-mariage-aissatou', {
      providerIds: [
        providerId('wax-and-wedding-deco'),
        providerId('studio-sankofa'),
        providerId('saveurs-de-dakar'),
      ],
    });
    expect(result.sent.map((s) => s.providerId)).toEqual([
      providerId('wax-and-wedding-deco'),
      providerId('studio-sankofa'),
    ]);
    // Saveurs de Dakar a déjà une demande en cours.
    expect(result.failed).toEqual([
      expect.objectContaining({
        providerId: providerId('saveurs-de-dakar'),
        code: 'already_requested',
      }),
    ]);
    expect(mockDb.data.quoteRequests.length).toBe(before + 2);
    const created = mockDb.data.quoteRequests.at(-1)!;
    expect(created).toMatchObject({
      clientId: 'user-aissatou',
      eventType: 'wedding',
      eventCity: 'Paris',
      eventPostalCode: '75011',
      guestCount: 150,
      budgetMin: 2_000_000,
      status: 'pending',
    });
    expect(created.message).toContain('« Mariage de Aïssatou »');
    // Une conversation est ouverte, comme pour une demande classique.
    expect(mockDb.data.conversations.some((c) => c.quoteRequestId === created.id)).toBe(true);

    const details = await aissatou.getEvent('evt-mariage-aissatou');
    expect(details.status).toBe('quotes');
    expect(details.counts).toEqual({ providers: 4, requested: 4, received: 1, retained: 0 });
  });

  it('les règles de la demande s’appliquent (prestataire indisponible ce jour-là)', async () => {
    const event = mockDb.data.events.find((e) => e.id === 'evt-mariage-aissatou')!;
    mockDb.update((data) => {
      data.unavailabilities.push({
        id: 'unav-test',
        providerId: providerId('studio-sankofa'),
        date: event.date,
        reason: 'manual',
        createdAt: mockDb.now().toISOString(),
        updatedAt: mockDb.now().toISOString(),
      });
    });
    const result = await aissatou.requestEventQuotes(event.id, {
      providerIds: [providerId('studio-sankofa')],
    });
    expect(result.sent).toEqual([]);
    expect(result.failed[0]).toMatchObject({ code: 'provider_unavailable' });
  });

  it('retenir exige un devis reçu ; ce n’est pas une réservation', async () => {
    const akwaba = providerId('compagnie-akwaba');
    await aissatou.setEventProviderRetained('evt-mariage-aissatou', akwaba, true);
    let details = await aissatou.getEvent('evt-mariage-aissatou');
    expect(details.providers.find((p) => p.provider.id === akwaba)!.status).toBe('retained');
    expect(details.counts.retained).toBe(1);
    expect(
      mockDb.data.bookings.filter((b) => b.clientId === 'user-aissatou' && b.providerId === akwaba),
    ).toEqual([]);

    await aissatou.setEventProviderRetained('evt-mariage-aissatou', akwaba, false);
    details = await aissatou.getEvent('evt-mariage-aissatou');
    expect(details.counts.retained).toBe(0);

    const tooEarly = await errorOf(
      aissatou.setEventProviderRetained('evt-mariage-aissatou', providerId('studio-sankofa'), true),
    );
    expect(tooEarly).toMatchObject({ status: 422, code: 'no_quote_yet' });
  });
});
