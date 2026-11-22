import { delay, http, HttpResponse } from 'msw';
import { updateMeInputSchema } from '../../schemas';
import type { MockDb } from '../db';
import { seedDemoAccounts } from '../seed/people';
import { apiError, currentUser, invalidInput } from './http';

/**
 * Connexion de démo (lot 2) : pas de mot de passe, on choisit un compte.
 * Le « jeton » est simplement « demo:<id> » ; le vrai back-end (lot 10)
 * renverra un jeton signé par Supabase.
 */
export function authHandlers(db: MockDb) {
  return [
    http.get('*/api/auth/demo-accounts', async () => {
      await delay();
      return HttpResponse.json(seedDemoAccounts);
    }),

    http.post('*/api/auth/demo-sign-in', async ({ request }) => {
      await delay();
      const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
      const user = db.data.users.find((u) => u.id === body?.userId);
      if (!user) {
        return apiError(404, 'unknown_account', 'Ce compte de démo n’existe pas.');
      }
      if (user.status !== 'active') {
        return apiError(403, 'account_inactive', 'Ce compte est suspendu.');
      }
      return HttpResponse.json({ user, token: `demo:${user.id}` });
    }),

    http.get('*/api/me', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      return HttpResponse.json(user);
    }),

    // C8 : modifier son compte (nom, téléphone, préférences de notification).
    http.patch('*/api/me', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      const parsed = updateMeInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      db.update(() => {
        const { phone, ...rest } = parsed.data;
        Object.assign(user, rest, { updatedAt: db.now().toISOString() });
        if (phone) user.phone = phone;
        else delete user.phone;
      });
      return HttpResponse.json(user);
    }),

    /*
     * C8 : supprimer son compte (RGPD). On n'efface pas les lignes, on ANONYMISE :
     * les avis, messages et réservations des autres restent cohérents, mais plus rien
     * ne permet de retrouver la personne. Refusé s'il reste une réservation à venir.
     */
    http.delete('*/api/me', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      if (user.roles.includes('admin')) {
        return apiError(
          422,
          'admin_account',
          'Un compte admin ne se supprime pas depuis l’application.',
        );
      }
      const today = db.now().toISOString().slice(0, 10);
      const provider = db.data.providers.find((p) => p.userId === user.id);
      const upcoming = db.data.bookings.some(
        (b) =>
          b.status === 'confirmed' &&
          b.eventDate >= today &&
          (b.clientId === user.id || b.providerId === provider?.id),
      );
      if (upcoming) {
        return apiError(
          409,
          'upcoming_bookings',
          'Tu as encore des réservations à venir : annule-les avant de supprimer ton compte.',
        );
      }
      db.update((data) => {
        const at = db.now().toISOString();
        Object.assign(user, {
          firstName: 'Utilisateur',
          lastName: 'supprimé',
          email: `supprime-${user.id}@teranga.invalid`,
          status: 'deleted',
          updatedAt: at,
        });
        delete user.phone;
        delete user.avatarUrl;
        // Les demandes encore ouvertes sont annulées.
        for (const request of data.quoteRequests) {
          const mine = request.clientId === user.id || request.providerId === provider?.id;
          if (mine && (request.status === 'pending' || request.status === 'quoted')) {
            Object.assign(request, { status: 'cancelled', updatedAt: at });
          }
        }
        // Le profil prestataire disparaît du site (statut forcé, hors cycle normal).
        if (provider) {
          Object.assign(provider, { status: 'suspended', bio: '', updatedAt: at });
          delete provider.siret;
          data.media = data.media.filter((m) => m.providerId !== provider.id);
        }
      });
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
