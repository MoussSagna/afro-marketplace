import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createHttpApiClient } from '../../api';
import { handlers, mockDb } from '..';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockDb.reset());
afterAll(() => server.close());

describe('connexion de démo', () => {
  const api = createHttpApiClient();

  it('liste les 3 comptes de démo', async () => {
    const accounts = await api.listDemoAccounts();
    expect(accounts.map((a) => a.label)).toEqual([
      'Aïssatou, cliente',
      'Saveurs de Dakar, prestataire',
      'Admin',
    ]);
  });

  it('ouvre une session avec un jeton', async () => {
    const session = await api.signInAsDemo('user-aissatou');
    expect(session.user.firstName).toBe('Aïssatou');
    expect(session.token).toBe('demo:user-aissatou');
  });

  it('refuse un compte inconnu', async () => {
    await expect(api.signInAsDemo('user-inconnu')).rejects.toMatchObject({
      status: 404,
      code: 'unknown_account',
    });
  });

  it('refuse un compte suspendu', async () => {
    mockDb.update((data) => {
      data.users.find((u) => u.id === 'user-aissatou')!.status = 'suspended';
    });
    await expect(api.signInAsDemo('user-aissatou')).rejects.toMatchObject({ status: 403 });
  });

  it('getMe renvoie l’utilisateur du jeton, ou une 401 sans jeton', async () => {
    const authed = createHttpApiClient({ getToken: () => 'demo:user-saveurs-de-dakar' });
    expect((await authed.getMe()).roles).toEqual(['client', 'provider']);
    await expect(api.getMe()).rejects.toMatchObject({ status: 401, code: 'unauthenticated' });
  });
});
