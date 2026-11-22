import { HttpResponse } from 'msw';
import type { z } from 'zod';
import type { MockDb } from '../db';

/*
 * Petits outils partagés par tous les handlers.
 */

/** Une erreur au format de l'API : { code, message }. Lue par httpApiClient. */
export function apiError(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status });
}

/**
 * L'utilisateur connecté, d'après l'en-tête « Authorization: Bearer demo:<userId> ».
 * Dans la démo, le jeton est simplement l'id de l'utilisateur ; le vrai back-end
 * vérifiera un jeton signé.
 */
export function currentUser(db: MockDb, request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/, '');
  if (!token?.startsWith('demo:')) return undefined;
  const userId = token.slice('demo:'.length);
  return db.data.users.find((u) => u.id === userId && u.status === 'active');
}

/** Réponse 400 pour un corps de requête invalide : on renvoie le premier message d'erreur Zod. */
export function invalidInput(error: z.ZodError) {
  return apiError(400, 'invalid_input', error.issues[0]?.message ?? 'Données invalides.');
}
