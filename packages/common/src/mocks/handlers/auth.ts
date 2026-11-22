import { delay, http, HttpResponse } from 'msw';
import type { MockDb } from '../db';
import { seedDemoAccounts } from '../seed/people';
import { apiError, currentUser } from './http';

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
  ];
}
