import type { ProviderProfile, QuoteRequest, QuoteRequestStatus, User } from '../types';
import { addDaysToDateTime, daysBetween } from '../utils/dates';
import { isProviderAvailable, type AvailabilityInput } from './isProviderAvailable';
import { allow, deny, type RuleResult } from './ruleResult';

/** Une demande sans réponse expire au bout de 7 jours. */
export const QUOTE_REQUEST_TTL_DAYS = 7;

/** On ne peut pas demander un devis plus de 2 ans à l'avance. */
export const MAX_DAYS_IN_ADVANCE = 730;

export type QuoteRequestDenial =
  | 'client_inactive'
  | 'own_provider'
  | 'provider_not_public'
  | 'date_in_past'
  | 'date_too_far'
  | 'provider_unavailable';

export interface CanSendQuoteRequestInput {
  client: Pick<User, 'id' | 'status'>;
  provider: Pick<ProviderProfile, 'userId' | 'status'> & AvailabilityInput;
  eventDate: string;
  /** Le jour actuel (« 2026-11-22 »), passé en paramètre pour que la règle reste testable. */
  today: string;
}

/**
 * Le client peut-il envoyer cette demande de devis ?
 * Regroupe la règle n° 4 (pas de demande à soi-même), la n° 3 (prestataire
 * disponible ce jour-là) et quelques garde-fous de bon sens.
 * Les vérifications sont faites dans l'ordre : le premier refus l'emporte.
 */
export function canSendQuoteRequest({
  client,
  provider,
  eventDate,
  today,
}: CanSendQuoteRequestInput): RuleResult<QuoteRequestDenial> {
  if (client.status !== 'active') {
    return deny('client_inactive', 'Ton compte ne permet pas d’envoyer de demande.');
  }
  // Règle n° 4 : cas du compte à deux rôles (client ET prestataire).
  if (provider.userId === client.id) {
    return deny('own_provider', 'Tu ne peux pas t’envoyer une demande à toi-même.');
  }
  if (provider.status !== 'published') {
    return deny('provider_not_public', 'Ce prestataire ne reçoit pas de demandes pour le moment.');
  }
  if (daysBetween(today, eventDate) < 1) {
    return deny('date_in_past', 'Choisis une date à partir de demain.');
  }
  if (daysBetween(today, eventDate) > MAX_DAYS_IN_ADVANCE) {
    return deny('date_too_far', 'On ne peut pas demander de devis plus de 2 ans à l’avance.');
  }
  // Règle n° 3.
  if (!isProviderAvailable(provider, eventDate)) {
    return deny('provider_unavailable', 'Ce prestataire n’est pas disponible à cette date.');
  }
  return allow();
}

/** Date d'expiration d'une demande créée à `createdAt`. */
export function computeQuoteRequestExpiresAt(createdAt: Date): string {
  return addDaysToDateTime(createdAt, QUOTE_REQUEST_TTL_DAYS);
}

/**
 * Une demande doit-elle passer en « expired » ?
 * Seulement si elle attend toujours une réponse (« pending ») et que la date
 * d'expiration est passée, OU que la date de l'événement est passée.
 */
export function shouldExpireQuoteRequest(
  request: Pick<QuoteRequest, 'status' | 'expiresAt' | 'eventDate'>,
  now: Date,
): boolean {
  if (request.status !== 'pending') return false;
  const today = now.toISOString().slice(0, 10);
  return new Date(request.expiresAt) <= now || request.eventDate <= today;
}

/** Les changements de statut autorisés pour une demande (diagramme de l'étape 2). */
const QUOTE_REQUEST_TRANSITIONS: Record<QuoteRequestStatus, readonly QuoteRequestStatus[]> = {
  pending: ['quoted', 'declined', 'expired', 'cancelled'],
  quoted: ['accepted', 'cancelled'],
  accepted: [],
  declined: [],
  expired: [],
  cancelled: [],
};

export function canChangeQuoteRequestStatus(
  from: QuoteRequestStatus,
  to: QuoteRequestStatus,
): boolean {
  return QUOTE_REQUEST_TRANSITIONS[from].includes(to);
}

/** Une demande est « en cours » tant qu'elle n'a pas abouti ni échoué. */
export function isQuoteRequestOpen(status: QuoteRequestStatus): boolean {
  return status === 'pending' || status === 'quoted';
}
