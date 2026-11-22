import { describe, expect, it } from 'vitest';
import { addDays } from '../utils/dates';
import { computeCancellationRefund, describeCancellationPolicy } from './cancellation';

const EVENT = '2027-06-12';

/** Annulation par le client `days` jours avant l'événement, pour 1 000 € payés. */
function refundFor(policy: 'flexible' | 'moderate' | 'strict', days: number) {
  return computeCancellationRefund({
    policy,
    amountPaid: 100000,
    eventDate: EVENT,
    cancelledOn: addDays(EVENT, -days),
    cancelledBy: 'client',
  });
}

describe('règle n° 9 : computeCancellationRefund', () => {
  it.each([
    // politique, jours avant, % remboursé
    ['flexible', 30, 100],
    ['flexible', 7, 100],
    ['flexible', 6, 50],
    ['flexible', 2, 50],
    ['flexible', 1, 0],
    ['moderate', 30, 100],
    ['moderate', 29, 50],
    ['moderate', 14, 50],
    ['moderate', 13, 0],
    ['strict', 60, 100],
    ['strict', 59, 50],
    ['strict', 30, 50],
    ['strict', 29, 0],
  ] as const)('%s, %i jours avant → %i %%', (policy, days, percent) => {
    const refund = refundFor(policy, days);
    expect(refund.refundPercent).toBe(percent);
    expect(refund.refundAmount).toBe(percent * 1000);
    expect(refund.daysBeforeEvent).toBe(days);
  });

  it('ne rembourse rien le jour même ou après l’événement', () => {
    expect(refundFor('flexible', 0).refundAmount).toBe(0);
    expect(refundFor('flexible', -3).refundAmount).toBe(0);
  });

  it('rembourse tout si c’est le prestataire qui annule, quelle que soit la politique', () => {
    const refund = computeCancellationRefund({
      policy: 'strict',
      amountPaid: 30000,
      eventDate: EVENT,
      cancelledOn: addDays(EVENT, -1),
      cancelledBy: 'provider',
    });
    expect(refund).toEqual({ daysBeforeEvent: 1, refundPercent: 100, refundAmount: 30000 });
  });

  it('arrondit le remboursement au centime', () => {
    const refund = computeCancellationRefund({
      policy: 'flexible',
      amountPaid: 999,
      eventDate: EVENT,
      cancelledOn: addDays(EVENT, -3),
      cancelledBy: 'client',
    });
    expect(refund.refundAmount).toBe(500); // 499,5 → 500
  });
});

describe('describeCancellationPolicy', () => {
  it('décrit la politique souple en phrases', () => {
    expect(describeCancellationPolicy('flexible')).toEqual([
      'Remboursement intégral jusqu’à 7 jours avant l’événement',
      '50 % remboursés jusqu’à 2 jours avant l’événement',
      'Aucun remboursement à moins de 2 jours',
    ]);
  });
});
