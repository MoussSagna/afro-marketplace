import { describe, expect, it } from 'vitest';
import { computeDepositAmount, computeQuoteTotal, isQuoteExpired, nextQuoteVersion } from './quote';

describe('computeQuoteTotal', () => {
  it('additionne quantité × prix unitaire', () => {
    expect(
      computeQuoteTotal([
        { quantity: 50, unitPrice: 1800 }, // 50 × 18 €
        { quantity: 1, unitPrice: 15000 }, // service 150 €
      ]),
    ).toBe(105000);
  });

  it('vaut 0 sans ligne', () => {
    expect(computeQuoteTotal([])).toBe(0);
  });
});

describe('computeDepositAmount', () => {
  it('calcule 30 % du total', () => {
    expect(computeDepositAmount(100000, 30)).toBe(30000);
  });

  it('arrondit au centime le plus proche', () => {
    expect(computeDepositAmount(999, 30)).toBe(300); // 299,7 → 300
    expect(computeDepositAmount(1001, 25)).toBe(250); // 250,25 → 250
  });

  it('gère 0 % et 100 %', () => {
    expect(computeDepositAmount(50000, 0)).toBe(0);
    expect(computeDepositAmount(50000, 100)).toBe(50000);
  });
});

describe('isQuoteExpired', () => {
  it('un devis reste valable jusqu’à sa date incluse', () => {
    expect(isQuoteExpired({ status: 'sent', validUntil: '2026-12-01' }, '2026-12-01')).toBe(false);
    expect(isQuoteExpired({ status: 'sent', validUntil: '2026-12-01' }, '2026-12-02')).toBe(true);
  });

  it('un devis accepté n’expire plus', () => {
    expect(isQuoteExpired({ status: 'accepted', validUntil: '2026-12-01' }, '2027-01-01')).toBe(
      false,
    );
  });
});

describe('nextQuoteVersion', () => {
  it('commence à 1', () => {
    expect(nextQuoteVersion([])).toBe(1);
  });

  it('suit la plus haute version existante', () => {
    expect(nextQuoteVersion([{ version: 1 }, { version: 3 }, { version: 2 }])).toBe(4);
  });
});
