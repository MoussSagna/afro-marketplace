import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { handlers, seedProviders } from '../mocks';
import { ApiError } from './ApiClient';
import { createHttpApiClient } from './httpApiClient';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createHttpApiClient', () => {
  const api = createHttpApiClient();

  it('récupère les prestataires mis en avant', async () => {
    const providers = await api.listFeaturedProviders();
    expect(providers).toHaveLength(seedProviders.length);
  });

  it('lève une ApiError quand le serveur échoue', async () => {
    server.use(http.get('*/api/providers/featured', () => new HttpResponse(null, { status: 500 })));
    await expect(api.listFeaturedProviders()).rejects.toBeInstanceOf(ApiError);
  });

  it('refuse une réponse qui ne respecte pas le schéma', async () => {
    server.use(http.get('*/api/providers/featured', () => HttpResponse.json([{ id: 42 }])));
    await expect(api.listFeaturedProviders()).rejects.toThrow();
  });
});
