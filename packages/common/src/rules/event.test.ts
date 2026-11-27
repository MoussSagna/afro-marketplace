import { describe, expect, it } from 'vitest';
import {
  budgetRangeOf,
  buildEventQuoteMessage,
  canRequestEventQuote,
  canRetainEventProvider,
  computeEventProviderStatus,
  computeEventStatus,
  countEventProviders,
  isValidEventDate,
  toQuoteEventType,
} from './event';

describe('computeEventProviderStatus', () => {
  it('se déduit de la demande de devis liée', () => {
    expect(computeEventProviderStatus({ retained: false })).toBe('added');
    expect(computeEventProviderStatus({ retained: false, quoteRequestStatus: 'pending' })).toBe(
      'requested',
    );
    expect(computeEventProviderStatus({ retained: false, quoteRequestStatus: 'quoted' })).toBe(
      'received',
    );
    expect(computeEventProviderStatus({ retained: true, quoteRequestStatus: 'quoted' })).toBe(
      'retained',
    );
    expect(computeEventProviderStatus({ retained: false, quoteRequestStatus: 'accepted' })).toBe(
      'booked',
    );
    for (const s of ['declined', 'expired', 'cancelled'] as const) {
      expect(computeEventProviderStatus({ retained: true, quoteRequestStatus: s })).toBe('closed');
    }
  });

  it('« retenu » sans devis reçu ne compte pas (la demande prime)', () => {
    expect(computeEventProviderStatus({ retained: true, quoteRequestStatus: 'pending' })).toBe(
      'requested',
    );
    expect(computeEventProviderStatus({ retained: true })).toBe('added');
  });
});

describe('countEventProviders', () => {
  it('calcule les 4 indicateurs', () => {
    expect(
      countEventProviders(['added', 'requested', 'received', 'retained', 'booked', 'closed']),
    ).toEqual({ providers: 6, requested: 5, received: 3, retained: 2 });
    expect(countEventProviders([])).toEqual({
      providers: 0,
      requested: 0,
      received: 0,
      retained: 0,
    });
  });
});

describe('computeEventStatus', () => {
  const today = '2026-11-27';
  it('passé après la date (pas le jour même)', () => {
    expect(computeEventStatus({ date: '2026-11-26' }, ['requested'], today)).toBe('past');
    expect(computeEventStatus({ date: '2026-11-27' }, [], today)).toBe('preparation');
  });
  it('devis en cours quand plus aucun prestataire n’est seulement ajouté', () => {
    expect(computeEventStatus({ date: '2027-02-10' }, ['requested', 'received'], today)).toBe(
      'quotes',
    );
    expect(computeEventStatus({ date: '2027-02-10' }, ['requested', 'added'], today)).toBe(
      'preparation',
    );
    expect(computeEventStatus({ date: '2027-02-10' }, ['received'], today)).toBe('preparation');
    expect(computeEventStatus({ date: '2027-02-10' }, [], today)).toBe('preparation');
  });
});

describe('règles d’action', () => {
  it('date : aujourd’hui ou plus tard', () => {
    expect(isValidEventDate('2026-11-27', '2026-11-27')).toBe(true);
    expect(isValidEventDate('2026-11-26', '2026-11-27')).toBe(false);
  });
  it('on redemande un devis seulement après une demande sans suite', () => {
    expect(canRequestEventQuote('added')).toBe(true);
    expect(canRequestEventQuote('closed')).toBe(true);
    for (const s of ['requested', 'received', 'retained', 'booked'] as const) {
      expect(canRequestEventQuote(s)).toBe(false);
    }
  });
  it('retenir exige un devis reçu, et pas déjà accepté', () => {
    expect(canRetainEventProvider('received')).toEqual({ allowed: true });
    expect(canRetainEventProvider('retained')).toEqual({ allowed: true });
    expect(canRetainEventProvider('added')).toMatchObject({
      allowed: false,
      reason: 'no_quote_yet',
    });
    expect(canRetainEventProvider('requested')).toMatchObject({
      allowed: false,
      reason: 'no_quote_yet',
    });
    expect(canRetainEventProvider('booked')).toMatchObject({
      allowed: false,
      reason: 'already_booked',
    });
  });
});

describe('demande de devis depuis un événement', () => {
  it('types et budgets convertis pour la demande', () => {
    expect(toQuoteEventType('wedding')).toBe('wedding');
    expect(toQuoteEventType('conference')).toBe('corporate');
    expect(toQuoteEventType('party')).toBe('other');
    expect(budgetRangeOf('3000_5000')).toEqual({ budgetMin: 300_000, budgetMax: 500_000 });
    expect(budgetRangeOf('under_1000')).toEqual({ budgetMax: 100_000 });
    expect(budgetRangeOf('over_20000')).toEqual({ budgetMin: 2_000_000 });
    expect(budgetRangeOf('undecided')).toEqual({});
    expect(budgetRangeOf(undefined)).toEqual({});
  });

  it('message : celui du client s’il est assez long, sinon une présentation de l’événement', () => {
    const event = {
      name: 'Mariage de Aïssatou',
      date: '2027-02-10',
      city: 'Paris',
      guestCount: 150,
      description: 'Ambiance afro-chic.',
    };
    expect(buildEventQuoteMessage(event, 'Bonjour, pouvez-vous nous faire un devis ?')).toBe(
      'Bonjour, pouvez-vous nous faire un devis ?',
    );
    const generated = buildEventQuoteMessage(event, 'Merci !');
    expect(generated).toContain(
      '« Mariage de Aïssatou » le 10 février 2027 à Paris, pour 150 invités.',
    );
    expect(generated).toContain('Ambiance afro-chic.');
    expect(generated).toContain('Merci !');
    expect(generated.length).toBeGreaterThanOrEqual(20);
    expect(buildEventQuoteMessage({ ...event, guestCount: 1, description: '' })).toContain(
      'pour 1 invité.',
    );
  });
});
