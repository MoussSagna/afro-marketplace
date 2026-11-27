import type { Offering } from '@afro/common';
import { describe, expect, it } from 'vitest';
import {
  formatResponseTime,
  maxGuestsOf,
  monogram,
  ratingDistribution,
  timeAgo,
} from './profileDisplay';

describe('ratingDistribution', () => {
  it('répartit les notes de 5 à 1 étoile avec des pourcentages entiers', () => {
    expect(ratingDistribution([5, 5, 5, 4])).toEqual([
      { stars: 5, count: 3, percent: 75 },
      { stars: 4, count: 1, percent: 25 },
      { stars: 3, count: 0, percent: 0 },
      { stars: 2, count: 0, percent: 0 },
      { stars: 1, count: 0, percent: 0 },
    ]);
  });

  it('renvoie 0 % partout quand il n’y a aucun avis', () => {
    expect(ratingDistribution([]).every((bucket) => bucket.percent === 0)).toBe(true);
  });

  it('range une note décimale dans l’étoile arrondie', () => {
    expect(ratingDistribution([4.6])[0]).toEqual({ stars: 5, count: 1, percent: 100 });
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-11-27T12:00:00Z');

  it.each([
    ['2026-09-27T12:00:00Z', 'il y a 2 mois'],
    ['2026-11-13T12:00:00Z', 'il y a 2 semaines'],
    ['2026-11-26T12:00:00Z', 'hier'],
    ['2026-11-27T09:00:00Z', 'il y a 3 heures'],
    ['2024-11-27T12:00:00Z', 'il y a 2 ans'],
    ['2026-11-27T11:59:30Z', 'à l’instant'],
  ])('%s → « %s »', (date, expected) => {
    expect(timeAgo(date, now)).toBe(expected);
  });
});

describe('formatResponseTime', () => {
  it('affiche des heures sous 24 h et des jours au-delà', () => {
    expect(formatResponseTime(3.2)).toBe('3 h');
    expect(formatResponseTime(0.2)).toBe('1 h');
    expect(formatResponseTime(48)).toBe('2 j');
  });
});

describe('maxGuestsOf', () => {
  const offering = (maxGuests?: number) => ({ maxGuests }) as Offering;

  it('renvoie le plus grand nombre d’invités des formules', () => {
    expect(maxGuestsOf([offering(80), offering(), offering(400)])).toBe(400);
  });

  it('renvoie undefined si aucune formule ne le précise', () => {
    expect(maxGuestsOf([offering()])).toBeUndefined();
  });
});

describe('monogram', () => {
  it.each([
    ['Saveurs de Dakar', 'SD'],
    ['Le Mafé Truck', 'MT'],
    ['Awa Diallo, conférencière', 'AD'],
    ['Ballet', 'B'],
    ['DJ', 'D'],
  ])('%s → %s', (name, expected) => {
    expect(monogram(name)).toBe(expected);
  });
});
