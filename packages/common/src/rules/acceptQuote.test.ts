import { describe, expect, it } from 'vitest';
import type { Quote, QuoteRequest } from '../types';
import { acceptQuote, canAcceptQuote } from './acceptQuote';

const now = new Date('2026-12-01T10:00:00Z');
const today = '2026-12-01';

const request: QuoteRequest = {
  id: 'qr-1',
  clientId: 'user-client',
  providerId: 'prov-1',
  clientType: 'individual',
  eventType: 'wedding',
  eventDate: '2027-03-20',
  eventCity: 'Paris',
  eventPostalCode: '75011',
  message: 'Bonjour, mariage pour 100 personnes',
  status: 'quoted',
  expiresAt: '2026-12-05T10:00:00.000Z',
  createdAt: '2026-11-20T10:00:00.000Z',
  updatedAt: '2026-11-20T10:00:00.000Z',
};

const quote = (version: number, status: Quote['status']): Quote => ({
  id: `quote-${version}`,
  quoteRequestId: 'qr-1',
  version,
  lines: [
    {
      id: `l-${version}`,
      quoteId: `quote-${version}`,
      label: 'Buffet',
      quantity: 100,
      unitPrice: 2500,
    },
  ],
  totalAmount: 250000 - version * 10000,
  depositRate: 30,
  validUntil: '2026-12-15',
  status,
  createdAt: '2026-11-21T10:00:00.000Z',
  updatedAt: '2026-11-21T10:00:00.000Z',
});

const free = { maxBookingsPerDay: 1, unavailabilities: [] };

describe('règle n° 5 : peut-on accepter ce devis ?', () => {
  const base = { userId: 'user-client', quote: quote(2, 'sent'), request, provider: free, today };

  it('oui pour le client, sur un devis envoyé et valable, à une date libre', () => {
    expect(canAcceptQuote(base)).toEqual({ allowed: true });
  });

  it('non pour quelqu’un d’autre que le client', () => {
    expect(canAcceptQuote({ ...base, userId: 'user-pro' })).toMatchObject({ reason: 'not_client' });
  });

  it('non pour une version remplacée ou une demande déjà acceptée', () => {
    expect(canAcceptQuote({ ...base, quote: quote(1, 'superseded') })).toMatchObject({
      reason: 'quote_not_sent',
    });
    expect(canAcceptQuote({ ...base, request: { ...request, status: 'accepted' } })).toMatchObject({
      reason: 'request_closed',
    });
  });

  it('non pour un devis dont la validité est passée', () => {
    expect(canAcceptQuote({ ...base, today: '2026-12-16' })).toMatchObject({
      reason: 'quote_expired',
    });
  });

  it('non si la date a été prise entre-temps', () => {
    const taken = {
      maxBookingsPerDay: 1,
      unavailabilities: [{ date: '2027-03-20', reason: 'booking' as const }],
    };
    expect(canAcceptQuote({ ...base, provider: taken })).toMatchObject({
      reason: 'provider_unavailable',
    });
  });
});

describe('règle n° 5 : accepter un devis', () => {
  let counter = 0;
  const result = acceptQuote({
    quote: quote(2, 'sent'),
    quotes: [quote(1, 'superseded'), quote(2, 'sent'), quote(3, 'sent')],
    request,
    provider: { id: 'prov-1', cancellationPolicy: 'moderate' },
    eventAddress: '12 rue des Fêtes, 75011 Paris',
    now,
    newId: (prefix) => `${prefix}-${++counter}`,
  });

  it('accepte la version choisie et remplace les autres versions encore ouvertes', () => {
    expect(result.quotes.map((q) => [q.version, q.status])).toEqual([
      [1, 'superseded'],
      [2, 'accepted'],
      [3, 'superseded'],
    ]);
  });

  it('crée une réservation confirmée qui copie les montants et la politique', () => {
    expect(result.booking).toMatchObject({
      quoteId: 'quote-2',
      clientId: 'user-client',
      providerId: 'prov-1',
      eventDate: '2027-03-20',
      eventAddress: '12 rue des Fêtes, 75011 Paris',
      totalAmount: 230000,
      depositAmount: 69000,
      cancellationPolicy: 'moderate',
      paymentMode: 'offline',
      commissionRate: 0,
      status: 'confirmed',
    });
  });

  it('bloque la date chez le prestataire et passe la demande en « accepted »', () => {
    expect(result.unavailability).toMatchObject({
      providerId: 'prov-1',
      date: '2027-03-20',
      reason: 'booking',
      bookingId: result.booking.id,
    });
    expect(result.request.status).toBe('accepted');
  });

  it('prépare le message système', () => {
    expect(result.systemMessage).toMatch(
      /^Devis n° 2 accepté \(2\s300\s€\) : réservation confirmée/,
    );
  });
});
