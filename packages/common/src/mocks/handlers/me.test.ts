import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, createHttpApiClient } from '../../api';
import { handlers, mockDb } from '..';

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
