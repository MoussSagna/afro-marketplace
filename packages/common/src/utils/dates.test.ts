import { describe, expect, it } from 'vitest';
import { addDays, addDaysToDateTime, daysBetween, parseIsoDate, toIsoDate } from './dates';

describe('outils de dates', () => {
  it('convertit une date en jour ISO (UTC)', () => {
    expect(toIsoDate(new Date('2026-11-22T23:30:00Z'))).toBe('2026-11-22');
  });

  it('relit un jour ISO à minuit UTC', () => {
    expect(parseIsoDate('2026-11-22').toISOString()).toBe('2026-11-22T00:00:00.000Z');
  });

  it('ajoute des jours en changeant de mois et d’année', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('ne se trompe pas au changement d’heure', () => {
    // En France, on passe à l'heure d'été le 29 mars 2026.
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });

  it('compte les jours entre deux dates, dans les deux sens', () => {
    expect(daysBetween('2026-12-01', '2026-12-31')).toBe(30);
    expect(daysBetween('2026-12-31', '2026-12-01')).toBe(-30);
    expect(daysBetween('2026-12-01', '2026-12-01')).toBe(0);
  });

  it('ajoute des jours à une date-heure', () => {
    expect(addDaysToDateTime(new Date('2026-11-22T10:00:00Z'), 7)).toBe('2026-11-29T10:00:00.000Z');
  });
});
