import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createHttpApiClient } from '../../api';
import { handlers, mockDb } from '..';
import { addDays, toIsoDate } from '../../utils/dates';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockDb.reset());
afterAll(() => server.close());

const api = createHttpApiClient();

describe('API des prestataires (mockée)', () => {
  it('recherche avec des filtres passés dans l’adresse', async () => {
    const result = await api.searchProviders({
      category: 'traiteurs',
      origins: ['senegal', 'cote-d-ivoire'],
      verifiedOnly: true,
      sort: 'rating',
      pageSize: 50,
    });
    expect(result.items.map((p) => p.slug).sort()).toEqual([
      'chez-tantie-adjoua',
      'saveurs-de-dakar',
    ]);
  });

  it('filtre par identifiants passés dans l’adresse (« ?ids=a,b »)', async () => {
    const ids = mockDb.data.providers
      .filter((p) => p.status === 'published')
      .slice(0, 2)
      .map((p) => p.id);
    const result = await api.searchProviders({ ids, pageSize: 50 });
    expect(result.items.map((p) => p.id).sort()).toEqual([...ids].sort());
  });

  it('refuse des filtres invalides', async () => {
    await expect(api.searchProviders({ date: 'demain' })).rejects.toMatchObject({
      status: 400,
      code: 'invalid_filters',
    });
  });

  it('renvoie le profil public, sans les champs internes', async () => {
    const details = await api.getProviderBySlug('saveurs-de-dakar');
    expect(details.profile.displayName).toBe('Saveurs de Dakar');
    expect(details.profile).not.toHaveProperty('siret');
    expect(details.offerings.length).toBeGreaterThan(0);
    expect(details.media.map((m) => m.order)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('renvoie une 404 pour un profil inconnu ou non publié', async () => {
    await expect(api.getProviderBySlug('inconnu')).rejects.toMatchObject({ status: 404 });
    await expect(api.getProviderBySlug('kompa-vibes-haiti')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('liste les avis publiés, du plus récent au plus ancien, avec le prénom de l’auteur', async () => {
    const reviews = await api.listProviderReviews('prov-saveurs-de-dakar');
    expect(reviews.length).toBe(8);
    const dates = reviews.map((r) => r.createdAt);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(reviews[0]!.author.lastNameInitial).toMatch(/^.\.$/);
    expect(reviews[0]!.author).not.toHaveProperty('email');
  });

  it('liste les jours indisponibles (blocages et jours complets)', async () => {
    const today = toIsoDate(mockDb.now());
    const dates = await api.listUnavailableDates('prov-saveurs-de-dakar', {
      from: today,
      to: addDays(today, 60),
    });
    expect(dates).toEqual([addDays(today, 15), addDays(today, 16)]);
  });

  it('refuse une période à l’envers', async () => {
    await expect(
      api.listUnavailableDates('prov-saveurs-de-dakar', { from: '2027-01-10', to: '2027-01-01' }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
