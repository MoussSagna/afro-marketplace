import { describe, expect, it } from 'vitest';
import { formatOfferingPrice, formatPrice } from './formatPrice';

// Intl utilise des espaces insécables : on les normalise pour des tests lisibles.
const normalize = (text: string) => text.replace(/\s/g, ' ');

describe('formatPrice', () => {
  it('affiche un montant rond sans centimes', () => {
    expect(normalize(formatPrice(90000))).toBe('900 €');
  });

  it('affiche les centimes quand il y en a', () => {
    expect(normalize(formatPrice(1250))).toBe('12,50 €');
  });

  it('sépare les milliers', () => {
    expect(normalize(formatPrice(1250000))).toBe('12 500 €');
  });

  it('gère zéro', () => {
    expect(normalize(formatPrice(0))).toBe('0 €');
  });
});

describe('formatOfferingPrice', () => {
  it.each([
    [{ pricingType: 'fixed', price: 40000 }, '400 €'],
    [{ pricingType: 'from', price: 35000 }, 'À partir de 350 €'],
    [{ pricingType: 'per_person', price: 2800 }, '28 € / personne'],
    [{ pricingType: 'on_quote' }, 'Sur devis'],
  ] as const)('%o → %s', (offering, expected) => {
    expect(normalize(formatOfferingPrice(offering))).toBe(expected);
  });
});
