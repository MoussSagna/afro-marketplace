import type {
  EventBudget,
  EventCounts,
  EventProviderStatus,
  EventStatus,
  EventType,
  PlannedEvent,
  PlannedEventType,
  QuoteRequestStatus,
} from '../types';
import { daysBetween } from '../utils/dates';
import { allow, deny, type RuleResult } from './ruleResult';

/*
 * Planificateur d'événements : règles pures (pas de réseau, pas d'horloge).
 * Rappel métier : on ajoute des prestataires, on leur demande un devis, on compare et on
 * « retient ». Retenir n'est PAS réserver : la réservation passe toujours par l'acceptation
 * d'un devis (règle n° 6).
 */

/**
 * Le statut d'un prestataire dans un événement, déduit de la demande de devis liée :
 * aucune demande → « Ajouté » ; en attente → « Devis demandé » ; devis envoyé → « Devis reçu »
 * (« Retenu » si le client l'a retenu) ; devis accepté → « Réservé » ;
 * déclinée, expirée ou annulée → « Sans suite ».
 */
export function computeEventProviderStatus(link: {
  retained: boolean;
  quoteRequestStatus?: QuoteRequestStatus;
}): EventProviderStatus {
  switch (link.quoteRequestStatus) {
    case undefined:
      return 'added';
    case 'pending':
      return 'requested';
    case 'quoted':
      return link.retained ? 'retained' : 'received';
    case 'accepted':
      return 'booked';
    default:
      return 'closed';
  }
}

/** Les 4 indicateurs du détail (et des cartes de « Mes événements »). */
export function countEventProviders(statuses: EventProviderStatus[]): EventCounts {
  const count = (...wanted: EventProviderStatus[]) =>
    statuses.filter((s) => wanted.includes(s)).length;
  return {
    providers: statuses.length,
    requested: count('requested', 'received', 'retained', 'booked', 'closed'),
    received: count('received', 'retained', 'booked'),
    retained: count('retained', 'booked'),
  };
}

/**
 * Le statut d'un événement : « Passé » après sa date ; « Devis en cours » quand des devis sont
 * demandés et qu'il ne reste plus de prestataire seulement ajouté ; sinon « En préparation ».
 */
export function computeEventStatus(
  event: Pick<PlannedEvent, 'date'>,
  statuses: EventProviderStatus[],
  today: string,
): EventStatus {
  if (daysBetween(today, event.date) < 0) return 'past';
  if (statuses.includes('requested') && !statuses.includes('added')) return 'quotes';
  return 'preparation';
}

/** La date d'un événement : aujourd'hui ou plus tard (les devis, eux, exigent demain au plus tôt). */
export function isValidEventDate(date: string, today: string): boolean {
  return daysBetween(today, date) >= 0;
}

/** On demande un devis à un prestataire « Ajouté », ou de nouveau après une demande sans suite. */
export function canRequestEventQuote(status: EventProviderStatus): boolean {
  return status === 'added' || status === 'closed';
}

export type RetainDenial = 'no_quote_yet' | 'already_booked';

/** Retenir n'a de sens qu'après avoir reçu un devis (et tant qu'il n'est pas accepté). */
export function canRetainEventProvider(status: EventProviderStatus): RuleResult<RetainDenial> {
  if (status === 'booked') {
    return deny('already_booked', 'Ce devis est déjà accepté : la réservation est confirmée.');
  }
  if (status !== 'received' && status !== 'retained') {
    return deny('no_quote_yet', 'Tu pourras retenir ce prestataire une fois son devis reçu.');
  }
  return allow();
}

/** Les types du planificateur n'existent pas tous dans les demandes de devis. */
export function toQuoteEventType(type: PlannedEventType): EventType {
  switch (type) {
    case 'wedding':
    case 'baptism':
    case 'birthday':
      return type;
    case 'conference':
      return 'corporate';
    default:
      return 'other';
  }
}

/** La fourchette de budget, en centimes, pour la demande de devis. */
export function budgetRangeOf(budget?: EventBudget): { budgetMin?: number; budgetMax?: number } {
  switch (budget) {
    case 'under_1000':
      return { budgetMax: 100_000 };
    case '1000_3000':
      return { budgetMin: 100_000, budgetMax: 300_000 };
    case '3000_5000':
      return { budgetMin: 300_000, budgetMax: 500_000 };
    case '5000_10000':
      return { budgetMin: 500_000, budgetMax: 1_000_000 };
    case '10000_20000':
      return { budgetMin: 1_000_000, budgetMax: 2_000_000 };
    case 'over_20000':
      return { budgetMin: 2_000_000 };
    default:
      return {};
  }
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Le message envoyé avec chaque demande de devis. Celui du client s'il en a écrit un
 * (20 caractères minimum, comme une demande classique), sinon une présentation de l'événement.
 */
export function buildEventQuoteMessage(
  event: Pick<PlannedEvent, 'name' | 'date' | 'city' | 'guestCount' | 'description'>,
  message?: string,
): string {
  const written = message?.trim() ?? '';
  if (written.length >= 20) return written;
  const day = dateFormatter.format(new Date(`${event.date}T00:00:00Z`));
  const parts = [
    `Bonjour, nous organisons « ${event.name} » le ${day} à ${event.city}, pour ${event.guestCount} invité${event.guestCount > 1 ? 's' : ''}.`,
    event.description.trim(),
    written,
    'Pourriez-vous nous envoyer un devis ? Merci !',
  ];
  return parts.filter(Boolean).join('\n\n');
}
