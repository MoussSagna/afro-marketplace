import { describe, expect, it } from 'vitest';
import { formatPrice } from './formatPrice';

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
