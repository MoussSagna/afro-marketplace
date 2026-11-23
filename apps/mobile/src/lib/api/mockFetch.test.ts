import { ApiError, createHttpApiClient } from '@afro/common';
import { createHandlers, createMockDb, seedDemoAccounts } from '@afro/common/mocks';
import { createMockFetch } from './mockFetch';

/** Un client API branché sur une base de démo neuve, comme dans l'app. */
function setup(token: string | null = null) {
  const db = createMockDb({ now: () => new Date('2026-11-23T10:00:00Z') });
  const fetchFn = createMockFetch(createHandlers(db));
  const api = createHttpApiClient({ fetchFn, getToken: () => token });
  return { db, api, fetchFn };
}

describe('createMockFetch : le client API répond avec les handlers MSW, sans réseau', () => {
  it('renvoie les catégories du jeu de démo', async () => {
    const { db, api } = setup();
    const categories = await api.listCategories();
    expect(categories).toEqual(db.data.categories);
    expect(categories.length).toBeGreaterThan(0);
  });

  it('transmet le jeton de session (en-tête Authorization)', async () => {
    const account = seedDemoAccounts[0]!;
    const { api } = setup(`demo:${account.userId}`);
    const me = await api.getMe();
    expect(me.id).toBe(account.userId);
  });

  it('transforme les erreurs des handlers en ApiError (ici : pas connecté)', async () => {
    const { api } = setup(null);
    await expect(api.getMe()).rejects.toMatchObject({ status: 401, code: 'unauthenticated' });
  });

  it('envoie le corps JSON des requêtes POST', async () => {
    const { api } = setup();
    const account = seedDemoAccounts[0]!;
    const session = await api.signInAsDemo(account.userId);
    expect(session.token).toBe(`demo:${account.userId}`);
    expect(session.user.id).toBe(account.userId);
  });

  it('répond 404 au format de l’API pour une route inconnue', async () => {
    const { fetchFn } = setup();
    const response = await fetchFn(new URL('http://localhost/api/inconnue'));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: 'not_found' });
  });

  it('ApiError reste la classe d’erreur partagée avec le site', async () => {
    const { api } = setup(null);
    await expect(api.getMe()).rejects.toBeInstanceOf(ApiError);
  });
});
