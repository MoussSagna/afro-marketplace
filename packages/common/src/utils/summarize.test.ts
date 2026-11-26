import { describe, expect, it } from 'vitest';
import { summarize } from './summarize';

describe('summarize', () => {
  it('garde la première phrase quand elle est courte', () => {
    expect(
      summarize('Afrobeats, amapiano et highlife. DJ résident dans plusieurs soirées parisiennes.'),
    ).toBe('Afrobeats, amapiano et highlife.');
  });

  it('renvoie un texte court sans ponctuation tel quel', () => {
    expect(summarize('  DJ   afro  ')).toBe('DJ afro');
  });

  it('coupe une longue phrase au dernier mot entier', () => {
    const text =
      'Makossa, ndombolo, afrobeats, coupé-décalé et zouk pour faire danser tout le monde';
    const result = summarize(text, 40);
    expect(result).toBe('Makossa, ndombolo, afrobeats…');
    expect(result!.length).toBeLessThanOrEqual(40);
  });

  it('renvoie undefined pour un texte vide', () => {
    expect(summarize('')).toBeUndefined();
    expect(summarize('   ')).toBeUndefined();
    expect(summarize(undefined)).toBeUndefined();
  });
});
