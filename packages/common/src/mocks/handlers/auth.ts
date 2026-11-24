import { delay, http, HttpResponse } from 'msw';
import {
  DEMO_OTP_CODE,
  forgotPasswordInputSchema,
  resendOtpInputSchema,
  resetPasswordInputSchema,
  signInInputSchema,
  signUpInputSchema,
  updateMeInputSchema,
  verifyOtpInputSchema,
} from '../../schemas';
import type { User } from '../../types';
import type { MockDb } from '../db';
import { seedDemoAccounts } from '../seed/people';
import { apiError, currentUser, invalidInput } from './http';

/**
 * Connexion de démo (lot 2) : pas de mot de passe, on choisit un compte.
 * Le « jeton » est simplement « demo:<id> » ; le vrai back-end (lot 10)
 * renverra un jeton signé par Supabase.
 */
export function authHandlers(db: MockDb) {
  const findUserByEmail = (email: string) =>
    db.data.users.find((u) => u.email.toLowerCase() === email && u.status !== 'deleted');
  const sessionFor = (user: User) => HttpResponse.json({ user, token: `demo:${user.id}` });
  const wrongCode = () =>
    apiError(400, 'invalid_code', 'Code incorrect. Vérifie le code reçu par email.');

  return [
    /*
     * Connexion et inscription par email (lot M5), SIMULÉES : aucun email n'est envoyé,
     * le code est toujours DEMO_OTP_CODE (« 123456 »). Supabase Auth prendra le relais.
     */
    http.post('*/api/auth/sign-up', async ({ request }) => {
      await delay();
      const parsed = signUpInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      const { email, firstName, password } = parsed.data;
      if (findUserByEmail(email)) {
        return apiError(409, 'email_taken', 'Un compte existe déjà avec cet email. Connecte-toi.');
      }
      db.update((data) => {
        data.pendingSignUps = data.pendingSignUps.filter((p) => p.email !== email);
        data.pendingSignUps.push({ email, firstName, password, createdAt: db.now().toISOString() });
      });
      return HttpResponse.json({ email }, { status: 201 });
    }),

    http.post('*/api/auth/verify-otp', async ({ request }) => {
      await delay();
      const parsed = verifyOtpInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      const { email, code, purpose } = parsed.data;
      if (code !== DEMO_OTP_CODE) return wrongCode();

      if (purpose === 'reset-password') {
        // Même réponse que pour un code faux si le compte n'existe pas : on ne révèle rien.
        return findUserByEmail(email) ? new HttpResponse(null, { status: 204 }) : wrongCode();
      }

      const pending = db.data.pendingSignUps.find((p) => p.email === email);
      if (!pending) {
        return apiError(404, 'no_pending_sign_up', 'Inscription introuvable : recommence.');
      }
      const user = db.update((data) => {
        const at = db.now().toISOString();
        const channels = (on: boolean) => ({ email: on, push: false, sms: false });
        const created: User = {
          id: db.newId('user'),
          email,
          firstName: pending.firstName,
          lastName: '-',
          roles: ['client'],
          authProvider: 'email',
          status: 'active',
          notificationPrefs: {
            quotes: channels(true),
            messages: channels(true),
            bookings: channels(true),
            marketing: channels(false),
          },
          createdAt: at,
          updatedAt: at,
        };
        data.users.push(created);
        data.credentials.push({ userId: created.id, email, password: pending.password });
        data.pendingSignUps = data.pendingSignUps.filter((p) => p.email !== email);
        return created;
      });
      return sessionFor(user);
    }),

    http.post('*/api/auth/resend-otp', async ({ request }) => {
      await delay();
      const parsed = resendOtpInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      // Démo : rien n'est envoyé, le code reste DEMO_OTP_CODE.
      return new HttpResponse(null, { status: 204 });
    }),

    http.post('*/api/auth/sign-in', async ({ request }) => {
      await delay();
      const parsed = signInInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      const { email, password } = parsed.data;
      const credential = db.data.credentials.find((c) => c.email === email);
      const user = credential && db.data.users.find((u) => u.id === credential.userId);
      if (!credential || !user || credential.password !== password || user.status === 'deleted') {
        return apiError(401, 'invalid_credentials', 'Email ou mot de passe incorrect.');
      }
      if (user.status !== 'active') {
        return apiError(403, 'account_inactive', 'Ce compte est suspendu.');
      }
      return sessionFor(user);
    }),

    http.post('*/api/auth/forgot-password', async ({ request }) => {
      await delay();
      const parsed = forgotPasswordInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      // Toujours la même réponse : on ne dit pas si un compte existe avec cet email.
      return new HttpResponse(null, { status: 204 });
    }),

    http.post('*/api/auth/reset-password', async ({ request }) => {
      await delay();
      const parsed = resetPasswordInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      const { email, code, password } = parsed.data;
      const user = findUserByEmail(email);
      if (code !== DEMO_OTP_CODE || !user) return wrongCode();
      if (user.status !== 'active') {
        return apiError(403, 'account_inactive', 'Ce compte est suspendu.');
      }
      db.update((data) => {
        const credential = data.credentials.find((c) => c.userId === user.id);
        if (credential) credential.password = password;
        else data.credentials.push({ userId: user.id, email, password });
      });
      return sessionFor(user);
    }),

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
          email: `supprime-${user.id}@wenzee.invalid`,
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
