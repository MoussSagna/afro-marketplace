import type { QuoteRequest } from '@afro/common';
import i18n from 'i18next';
import { requestStatus, type StatusTone } from '../messaging/requestStatus';

const ONE_DAY_MS = 86_400_000;
/** En dessous de 2 jours avant expiration, la demande passe en rouge (maquette S2). */
const URGENT_DAYS = 2;

/**
 * Le badge d'une demande reçue, sur le tableau de bord (S2) :
 * - en attente et bientôt expirée : rouge « Expire dans 2 j » (ou « aujourd'hui ») ;
 * - en attente : soleil « Nouveau » ;
 * - sinon : le badge habituel côté prestataire (« Devis envoyé », « Réservée »…).
 */
export function requestUrgency(
  request: Pick<QuoteRequest, 'status' | 'expiresAt'>,
  now: Date = new Date(),
): { label: string; tone: StatusTone | 'destructive' } {
  if (request.status !== 'pending') return requestStatus(request, 'provider', now);
  const left = new Date(request.expiresAt).getTime() - now.getTime();
  const days = Math.ceil(left / ONE_DAY_MS);
  if (left > 0 && days <= URGENT_DAYS) {
    return {
      label:
        left < ONE_DAY_MS ? i18n.t('pro.expiresToday') : i18n.t('pro.expiresIn', { count: days }),
      tone: 'destructive',
    };
  }
  return { label: i18n.t('pro.newRequest'), tone: 'sun' };
}

/** Les demandes à traiter (en attente), la plus urgente d'abord. */
export function requestsToHandle<T extends { request: Pick<QuoteRequest, 'status' | 'expiresAt'> }>(
  summaries: readonly T[],
): T[] {
  return summaries
    .filter((s) => s.request.status === 'pending')
    .sort((a, b) => a.request.expiresAt.localeCompare(b.request.expiresAt));
}
