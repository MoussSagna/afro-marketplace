import { describe, expect, it } from 'vitest';
import {
  canChangeQuoteRequestStatus,
  canSendQuoteRequest,
  computeQuoteRequestExpiresAt,
  isQuoteRequestOpen,
  shouldExpireQuoteRequest,
  type CanSendQuoteRequestInput,
} from './quoteRequest';

const TODAY = '2026-11-22';

const valid: CanSendQuoteRequestInput = {
  client: { id: 'user-aissatou', status: 'active' },
  provider: {
    userId: 'user-mamadou',
    status: 'published',
    maxBookingsPerDay: 1,
    unavailabilities: [],
  },
  eventDate: '2027-06-12',
  today: TODAY,
};

describe('canSendQuoteRequest', () => {
  it('autorise une demande normale', () => {
    expect(canSendQuoteRequest(valid)).toEqual({ allowed: true });
  });

  it('règle n° 4 : refuse une demande à son propre profil prestataire', () => {
    const result = canSendQuoteRequest({
      ...valid,
      client: { id: 'user-mamadou', status: 'active' },
    });
    expect(result).toMatchObject({ allowed: false, reason: 'own_provider' });
  });

  it('règle n° 3 : refuse une date bloquée par le prestataire', () => {
    const result = canSendQuoteRequest({
      ...valid,
      provider: {
        ...valid.provider,
        unavailabilities: [{ date: '2027-06-12', reason: 'manual' }],
      },
    });
    expect(result).toEqual({
      allowed: false,
      reason: 'provider_unavailable',
      message: 'Ce prestataire n’est pas disponible à cette date.',
    });
  });

  it('règle n° 3 : refuse une date déjà complète', () => {
    const result = canSendQuoteRequest({
      ...valid,
      provider: {
        ...valid.provider,
        unavailabilities: [{ date: '2027-06-12', reason: 'booking' }],
      },
    });
    expect(result).toMatchObject({ allowed: false, reason: 'provider_unavailable' });
  });

  it('refuse un prestataire non publié (en pause, en attente…)', () => {
    const result = canSendQuoteRequest({
      ...valid,
      provider: { ...valid.provider, status: 'paused' },
    });
    expect(result).toMatchObject({ allowed: false, reason: 'provider_not_public' });
  });

  it('refuse un client suspendu', () => {
    const result = canSendQuoteRequest({
      ...valid,
      client: { id: 'user-aissatou', status: 'suspended' },
    });
    expect(result).toMatchObject({ allowed: false, reason: 'client_inactive' });
  });

  it('refuse aujourd’hui et les dates passées, accepte demain', () => {
    expect(canSendQuoteRequest({ ...valid, eventDate: '2026-11-21' })).toMatchObject({
      reason: 'date_in_past',
    });
    expect(canSendQuoteRequest({ ...valid, eventDate: TODAY })).toMatchObject({
      reason: 'date_in_past',
    });
    expect(canSendQuoteRequest({ ...valid, eventDate: '2026-11-23' }).allowed).toBe(true);
  });

  it('refuse une date à plus de 2 ans', () => {
    expect(canSendQuoteRequest({ ...valid, eventDate: '2028-11-22' })).toMatchObject({
      reason: 'date_too_far',
    });
    expect(canSendQuoteRequest({ ...valid, eventDate: '2028-11-21' }).allowed).toBe(true);
  });

  it('vérifie d’abord la règle n° 4, avant la disponibilité', () => {
    const result = canSendQuoteRequest({
      ...valid,
      client: { id: 'user-mamadou', status: 'active' },
      provider: {
        ...valid.provider,
        unavailabilities: [{ date: '2027-06-12', reason: 'manual' }],
      },
    });
    expect(result).toMatchObject({ reason: 'own_provider' });
  });
});

describe('expiration des demandes', () => {
  const createdAt = new Date('2026-11-22T10:00:00Z');
  const request = {
    status: 'pending' as const,
    expiresAt: computeQuoteRequestExpiresAt(createdAt),
    eventDate: '2027-06-12',
  };

  it('expire 7 jours après la création', () => {
    expect(request.expiresAt).toBe('2026-11-29T10:00:00.000Z');
  });

  it('n’expire pas avant 7 jours', () => {
    expect(shouldExpireQuoteRequest(request, new Date('2026-11-29T09:59:59Z'))).toBe(false);
  });

  it('expire pile à 7 jours', () => {
    expect(shouldExpireQuoteRequest(request, new Date('2026-11-29T10:00:00Z'))).toBe(true);
  });

  it('expire si la date de l’événement est passée, même avant 7 jours', () => {
    expect(
      shouldExpireQuoteRequest(
        { ...request, eventDate: '2026-11-24' },
        new Date('2026-11-24T08:00:00Z'),
      ),
    ).toBe(true);
  });

  it('n’expire jamais une demande qui a déjà reçu un devis', () => {
    expect(
      shouldExpireQuoteRequest({ ...request, status: 'quoted' }, new Date('2027-01-01T00:00:00Z')),
    ).toBe(false);
  });
});

describe('cycle de vie d’une demande', () => {
  it.each([
    ['pending', 'quoted'],
    ['pending', 'declined'],
    ['pending', 'expired'],
    ['pending', 'cancelled'],
    ['quoted', 'accepted'],
    ['quoted', 'cancelled'],
  ] as const)('autorise %s → %s', (from, to) => {
    expect(canChangeQuoteRequestStatus(from, to)).toBe(true);
  });

  it.each([
    ['pending', 'accepted'],
    ['quoted', 'declined'],
    ['accepted', 'cancelled'],
    ['expired', 'pending'],
  ] as const)('interdit %s → %s', (from, to) => {
    expect(canChangeQuoteRequestStatus(from, to)).toBe(false);
  });

  it('une demande est en cours tant qu’elle attend ou a un devis', () => {
    expect(isQuoteRequestOpen('pending')).toBe(true);
    expect(isQuoteRequestOpen('quoted')).toBe(true);
    expect(isQuoteRequestOpen('accepted')).toBe(false);
    expect(isQuoteRequestOpen('expired')).toBe(false);
  });
});
