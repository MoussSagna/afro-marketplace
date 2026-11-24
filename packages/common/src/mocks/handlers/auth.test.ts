import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createHttpApiClient } from '../../api';
import { DEMO_OTP_CODE } from '../../schemas';
import { DEMO_PASSWORD, handlers, mockDb } from '..';

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

describe('connexion et inscription par email (lot M5, simulées)', () => {
  const api = createHttpApiClient();
  const newcomer = {
    firstName: 'Fatou',
    email: 'Fatou.Diop@Email.fr',
    password: 'Wenzee26',
    acceptTerms: true as const,
  };

  it('inscription → code de démo → compte créé et session ouverte', async () => {
    await expect(api.signUp(newcomer)).resolves.toEqual({ email: 'fatou.diop@email.fr' });
    const session = await api.verifyOtp({
      email: newcomer.email,
      code: DEMO_OTP_CODE,
      purpose: 'sign-up',
    });
    expect(session?.user).toMatchObject({
      email: 'fatou.diop@email.fr',
      firstName: 'Fatou',
      roles: ['client'],
      status: 'active',
    });
    expect(session?.token).toBe(`demo:${session?.user.id}`);
    expect(mockDb.data.pendingSignUps).toHaveLength(0);

    // Le nouveau compte peut ensuite se connecter avec son mot de passe.
    const again = await api.signIn({ email: 'fatou.diop@email.fr', password: 'Wenzee26' });
    expect(again.user.id).toBe(session?.user.id);
  });

  it('refuse un code faux', async () => {
    await api.signUp(newcomer);
    await expect(
      api.verifyOtp({ email: newcomer.email, code: '000000', purpose: 'sign-up' }),
    ).rejects.toMatchObject({ status: 400, code: 'invalid_code' });
  });

  it('refuse une inscription avec un email déjà utilisé', async () => {
    await expect(
      api.signUp({ ...newcomer, email: 'aissatou.ndiaye@example.com' }),
    ).rejects.toMatchObject({ status: 409, code: 'email_taken' });
  });

  it('refuse une inscription invalide (mot de passe trop faible)', async () => {
    await expect(api.signUp({ ...newcomer, password: 'faible' })).rejects.toMatchObject({
      status: 400,
      message: 'Au moins 8 caractères',
    });
  });

  it('renvoie le code sans erreur', async () => {
    await expect(
      api.resendOtp({ email: newcomer.email, purpose: 'sign-up' }),
    ).resolves.toBeUndefined();
  });

  it('connecte un compte de démo avec le mot de passe de démo', async () => {
    const session = await api.signIn({
      email: ' Aissatou.Ndiaye@example.com',
      password: DEMO_PASSWORD,
    });
    expect(session.user.id).toBe('user-aissatou');
  });

  it('« Email ou mot de passe incorrect » sans dire lequel des deux', async () => {
    const wrongPassword = api.signIn({
      email: 'aissatou.ndiaye@example.com',
      password: 'Faux1234',
    });
    await expect(wrongPassword).rejects.toMatchObject({
      status: 401,
      message: 'Email ou mot de passe incorrect.',
    });
    const unknown = api.signIn({ email: 'personne@example.com', password: DEMO_PASSWORD });
    await expect(unknown).rejects.toMatchObject({
      status: 401,
      message: 'Email ou mot de passe incorrect.',
    });
  });

  it('mot de passe oublié : même réponse que le compte existe ou non', async () => {
    await expect(
      api.forgotPassword({ email: 'aissatou.ndiaye@example.com' }),
    ).resolves.toBeUndefined();
    await expect(api.forgotPassword({ email: 'personne@example.com' })).resolves.toBeUndefined();
  });

  it('mot de passe oublié → code → nouveau mot de passe → connecté', async () => {
    const email = 'aissatou.ndiaye@example.com';
    await api.forgotPassword({ email });
    await expect(
      api.verifyOtp({ email, code: DEMO_OTP_CODE, purpose: 'reset-password' }),
    ).resolves.toBeNull();

    const session = await api.resetPassword({
      email,
      code: DEMO_OTP_CODE,
      password: 'Nouveau2026',
    });
    expect(session.user.id).toBe('user-aissatou');
    await expect(api.signIn({ email, password: DEMO_PASSWORD })).rejects.toMatchObject({
      status: 401,
    });
    await expect(api.signIn({ email, password: 'Nouveau2026' })).resolves.toMatchObject({
      user: { id: 'user-aissatou' },
    });
  });

  it('refuse un nouveau mot de passe avec un code faux', async () => {
    await expect(
      api.resetPassword({
        email: 'aissatou.ndiaye@example.com',
        code: '999999',
        password: 'Nouveau2026',
      }),
    ).rejects.toMatchObject({ status: 400, code: 'invalid_code' });
  });
});
