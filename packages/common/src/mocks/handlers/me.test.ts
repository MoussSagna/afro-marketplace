import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, createHttpApiClient } from '../../api';
import { handlers, mockDb } from '..';
import { DEMO_PASSWORD } from '../seed/people';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockDb.reset());
afterAll(() => server.close());

const as = (userId: string) => createHttpApiClient({ getToken: () => `demo:${userId}` });

async function errorOf(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

/** Kevin : un client de la démo sans réservation à venir. */
function userWithoutUpcomingBooking() {
  const today = mockDb.now().toISOString().slice(0, 10);
  return mockDb.data.users.find(
    (u) =>
      !u.roles.includes('admin') &&
      !u.roles.includes('provider') &&
      !mockDb.data.bookings.some(
        (b) => b.clientId === u.id && b.status === 'confirmed' && b.eventDate >= today,
      ),
  )!;
}

describe('Mon compte (C8)', () => {
  it('modifie le nom, le téléphone et les préférences', async () => {
    const api = as('user-aissatou');
    const me = await api.getMe();
    const updated = await api.updateMe({
      firstName: 'Aïssa',
      lastName: me.lastName,
      phone: '06 12 34 56 78',
      notificationPrefs: {
        ...me.notificationPrefs,
        marketing: { email: false, push: false, sms: false },
      },
    });
    expect(updated).toMatchObject({ firstName: 'Aïssa', phone: '06 12 34 56 78' });
    expect(updated.notificationPrefs.marketing.email).toBe(false);

    const invalid = await errorOf(
      api.updateMe({ ...updated, phone: '123', notificationPrefs: updated.notificationPrefs }),
    );
    expect(invalid.status).toBe(400);
  });

  it('enregistre la ville et la photo, et les retire quand elles sont absentes', async () => {
    const api = as('user-aissatou');
    const me = await api.getMe();
    const base = {
      firstName: me.firstName,
      lastName: me.lastName,
      notificationPrefs: me.notificationPrefs,
    };
    const photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const updated = await api.updateMe({ ...base, city: ' Lyon ', avatarUrl: photo });
    expect(updated).toMatchObject({ city: 'Lyon', avatarUrl: photo });

    const cleared = await api.updateMe(base);
    expect(cleared.city).toBeUndefined();
    expect(cleared.avatarUrl).toBeUndefined();
    expect(mockDb.data.users.find((u) => u.id === 'user-aissatou')!.city).toBeUndefined();
  });

  it('change le mot de passe après avoir vérifié l’actuel', async () => {
    const api = as('user-aissatou');
    const { email } = await api.getMe();
    const wrong = await errorOf(
      api.changePassword({ currentPassword: 'Mauvais1', newPassword: 'Nouveau2027' }),
    );
    expect(wrong).toMatchObject({ status: 400, code: 'wrong_password' });
    const weak = await errorOf(
      api.changePassword({ currentPassword: DEMO_PASSWORD, newPassword: 'court' }),
    );
    expect(weak.status).toBe(400);

    await api.changePassword({ currentPassword: DEMO_PASSWORD, newPassword: 'Nouveau2027' });
    const anonymous = createHttpApiClient();
    await expect(anonymous.signIn({ email, password: 'Nouveau2027' })).resolves.toMatchObject({
      user: { id: 'user-aissatou' },
    });
    const old = await errorOf(anonymous.signIn({ email, password: DEMO_PASSWORD }));
    expect(old.code).toBe('invalid_credentials');
  });

  it('refuse de changer le mot de passe sans session', async () => {
    const error = await errorOf(
      createHttpApiClient().changePassword({
        currentPassword: DEMO_PASSWORD,
        newPassword: 'Nouveau2027',
      }),
    );
    expect(error.status).toBe(401);
  });

  it('refuse la suppression s’il reste une réservation à venir', async () => {
    const error = await errorOf(as('user-aissatou').deleteMe());
    expect(error).toMatchObject({ status: 409, code: 'upcoming_bookings' });
  });

  it('supprimer anonymise le compte et coupe la connexion (RGPD)', async () => {
    const user = userWithoutUpcomingBooking();
    const email = user.email;
    await as(user.id).deleteMe();

    const after = mockDb.data.users.find((u) => u.id === user.id)!;
    expect(after).toMatchObject({
      status: 'deleted',
      firstName: 'Utilisateur',
      lastName: 'supprimé',
    });
    expect(after.email).not.toBe(email);
    expect(after.phone).toBeUndefined();
    expect((await errorOf(as(user.id).getMe())).status).toBe(401);
    // Ses demandes encore ouvertes sont annulées.
    expect(
      mockDb.data.quoteRequests.filter(
        (r) => r.clientId === user.id && (r.status === 'pending' || r.status === 'quoted'),
      ),
    ).toHaveLength(0);
  });
});
