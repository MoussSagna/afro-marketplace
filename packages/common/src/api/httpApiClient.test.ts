import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FEATURED_PROVIDERS_COUNT, handlers, mockDb } from '../mocks';
import { ApiError } from './ApiClient';
import { createHttpApiClient, toQueryString } from './httpApiClient';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  mockDb.reset();
});
afterAll(() => server.close());

describe('createHttpApiClient', () => {
  const api = createHttpApiClient();

  it('récupère les prestataires mis en avant, les mieux notés d’abord', async () => {
    const providers = await api.listFeaturedProviders();
    expect(providers).toHaveLength(FEATURED_PROVIDERS_COUNT);
    const ratings = providers.map((p) => p.ratingAverage);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it('ne met jamais en avant un profil non publié', async () => {
    mockDb.update((data) => {
      for (const p of data.providers) p.status = 'paused';
    });
    expect(await api.listFeaturedProviders()).toEqual([]);
  });

  it('récupère les catégories et les origines', async () => {
    expect((await api.listCategories()).length).toBeGreaterThan(10);
    expect(await api.listCulturalOrigins()).toContainEqual(
      expect.objectContaining({ slug: 'senegal' }),
    );
  });

  it('lève une ApiError quand le serveur échoue', async () => {
    server.use(http.get('*/api/providers/featured', () => new HttpResponse(null, { status: 500 })));
    await expect(api.listFeaturedProviders()).rejects.toBeInstanceOf(ApiError);
  });

  it('garde le code et le message d’erreur envoyés par le serveur', async () => {
    server.use(
      http.get('*/api/providers/featured', () =>
        HttpResponse.json({ code: 'not_found', message: 'Introuvable' }, { status: 404 }),
      ),
    );
    await expect(api.listFeaturedProviders()).rejects.toMatchObject({
      status: 404,
      code: 'not_found',
      message: 'Introuvable',
    });
  });

  it('refuse une réponse qui ne respecte pas le schéma', async () => {
    server.use(http.get('*/api/providers/featured', () => HttpResponse.json([{ id: 42 }])));
    await expect(api.listFeaturedProviders()).rejects.toThrow();
  });

  it('envoie le jeton de session et le corps en JSON', async () => {
    let seen: { auth: string | null; body: unknown } | undefined;
    server.use(
      http.post('*/api/reports', async ({ request }) => {
        seen = { auth: request.headers.get('Authorization'), body: await request.json() };
        return HttpResponse.json(mockDb.data.reports[0]);
      }),
    );
    const authed = createHttpApiClient({ getToken: () => 'demo:user-aissatou' });
    await authed.createReport({ targetType: 'provider', targetId: 'prov-1', reason: 'spam' });
    expect(seen).toEqual({
      auth: 'Bearer demo:user-aissatou',
      body: { targetType: 'provider', targetId: 'prov-1', reason: 'spam' },
    });
  });

  it('accepte une réponse vide (204) pour les suppressions', async () => {
    server.use(
      http.delete('*/api/me/provider/media/:id', () => new HttpResponse(null, { status: 204 })),
    );
    await expect(api.deleteMedia('media-1')).resolves.toBeUndefined();
  });
});

describe('toQueryString', () => {
  it('ignore les valeurs vides et joint les listes par des virgules', () => {
    expect(
      toQueryString({
        category: 'traiteurs',
        origins: ['senegal', 'mali'],
        q: '',
        page: 2,
        city: undefined,
        verifiedOnly: true,
      }),
    ).toBe('?category=traiteurs&origins=senegal%2Cmali&page=2&verifiedOnly=true');
  });

  it('renvoie une chaîne vide sans filtre', () => {
    expect(toQueryString({ origins: [] })).toBe('');
  });
});
