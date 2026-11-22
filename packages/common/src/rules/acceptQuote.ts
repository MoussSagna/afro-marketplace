import type { Booking, ProviderProfile, Quote, QuoteRequest, Unavailability } from '../types';
import { formatPrice } from '../utils/formatPrice';
import { isProviderAvailable, type AvailabilityInput } from './isProviderAvailable';
import { computeDepositAmount, isQuoteExpired } from './quote';
import { allow, deny, type RuleResult } from './ruleResult';

export type AcceptQuoteDenial =
  'not_client' | 'request_closed' | 'quote_not_sent' | 'quote_expired' | 'provider_unavailable';

export interface CanAcceptQuoteInput {
  /** Celui qui clique sur « Accepter ». */
  userId: string;
  quote: Pick<Quote, 'status' | 'validUntil'>;
  request: Pick<QuoteRequest, 'clientId' | 'status' | 'eventDate'>;
  provider: AvailabilityInput;
  /** Le jour actuel (« 2026-11-22 »). */
  today: string;
}

/**
 * Règle n° 5, première moitié : le client peut-il accepter ce devis ?
 * Seul le client de la demande, sur un devis envoyé, encore valable,
 * et si la date est toujours libre chez le prestataire (une autre réservation
 * a pu la prendre entre-temps).
 */
export function canAcceptQuote({
  userId,
  quote,
  request,
  provider,
  today,
}: CanAcceptQuoteInput): RuleResult<AcceptQuoteDenial> {
  if (request.clientId !== userId) {
    return deny('not_client', 'Seul le client de la demande peut accepter ce devis.');
  }
  if (request.status !== 'quoted') {
    return deny('request_closed', 'Cette demande n’attend plus de réponse à un devis.');
  }
  if (quote.status !== 'sent') {
    return deny('quote_not_sent', 'Ce devis n’est plus valable : une autre version l’a remplacé.');
  }
  if (isQuoteExpired(quote, today)) {
    return deny('quote_expired', 'Ce devis a expiré. Demande une nouvelle version au prestataire.');
  }
  if (!isProviderAvailable(provider, request.eventDate)) {
    return deny('provider_unavailable', 'Le prestataire n’est plus disponible à cette date.');
  }
  return allow();
}

export interface AcceptQuoteParams {
  quote: Quote;
  /** Toutes les versions de devis de la demande (celle acceptée comprise). */
  quotes: readonly Quote[];
  request: QuoteRequest;
  provider: Pick<ProviderProfile, 'id' | 'cancellationPolicy'>;
  eventAddress: string;
  now: Date;
  newId: (prefix: string) => string;
}

export interface AcceptQuoteResult {
  booking: Booking;
  /** La date bloquée dans l'agenda du prestataire. */
  unavailability: Unavailability;
  /** Toutes les versions, à jour : l'acceptée en « accepted », les autres encore ouvertes en « superseded ». */
  quotes: Quote[];
  request: QuoteRequest;
  /** Le message système à poster dans la conversation. */
  systemMessage: string;
}

/**
 * Règle n° 5, seconde moitié : ce qui change quand un devis est accepté.
 * Fonction pure : elle CALCULE les nouveaux objets, sans rien enregistrer.
 * Le serveur (ici la base mockée, demain Supabase) les enregistre ensemble.
 * À appeler seulement si `canAcceptQuote` a dit oui.
 */
export function acceptQuote({
  quote,
  quotes,
  request,
  provider,
  eventAddress,
  now,
  newId,
}: AcceptQuoteParams): AcceptQuoteResult {
  const at = now.toISOString();
  const bookingId = newId('book');

  const booking: Booking = {
    id: bookingId,
    quoteId: quote.id,
    quoteRequestId: request.id,
    clientId: request.clientId,
    providerId: provider.id,
    eventDate: request.eventDate,
    eventAddress,
    // Montants et politique COPIÉS : la réservation ne bouge plus ensuite.
    totalAmount: quote.totalAmount,
    depositAmount: computeDepositAmount(quote.totalAmount, quote.depositRate),
    paymentMode: 'offline',
    commissionRate: 0,
    cancellationPolicy: provider.cancellationPolicy,
    status: 'confirmed',
    createdAt: at,
    updatedAt: at,
  };

  return {
    booking,
    unavailability: {
      id: newId('unav'),
      providerId: provider.id,
      date: request.eventDate,
      reason: 'booking',
      bookingId,
      createdAt: at,
      updatedAt: at,
    },
    quotes: quotes.map((q) => {
      if (q.id === quote.id) return { ...q, status: 'accepted', updatedAt: at };
      if (q.status === 'sent') return { ...q, status: 'superseded', updatedAt: at };
      return q;
    }),
    request: { ...request, status: 'accepted', updatedAt: at },
    systemMessage: `Devis n° ${quote.version} accepté (${formatPrice(quote.totalAmount)}) : réservation confirmée ! Les coordonnées sont désormais visibles.`,
  };
}
