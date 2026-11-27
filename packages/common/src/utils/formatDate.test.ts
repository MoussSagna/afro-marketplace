import { describe, expect, it } from 'vitest';
import { formatDateTime, formatEventDate, formatMessageTime, formatTimeAgo } from './formatDate';

describe('formatage des dates', () => {
  it('affiche une date d’événement en toutes lettres', () => {
    expect(formatEventDate('2027-06-12')).toBe('samedi 12 juin 2027');
  });

  it('affiche l’heure de Paris pour un message du jour, la date sinon', () => {
    const now = new Date('2026-12-03T18:00:00Z');
    // 13:05 UTC = 14:05 à Paris (heure d'hiver).
    expect(formatMessageTime('2026-12-03T13:05:00Z', now)).toBe('14:05');
    expect(formatMessageTime('2026-12-01T13:05:00Z', now)).toBe('1 déc.');
  });

  it('change de jour à minuit heure de Paris, pas à minuit UTC', () => {
    const now = new Date('2026-12-03T23:30:00Z'); // 00:30 le 4 décembre à Paris
    expect(formatMessageTime('2026-12-03T23:10:00Z', now)).toBe('00:10');
  });

  it('donne un horodatage complet', () => {
    expect(formatDateTime('2026-12-03T13:05:00Z')).toBe('3 déc. à 14:05');
  });

  it('affiche le temps écoulé, court puis en toutes lettres', () => {
    const now = new Date('2026-12-03T18:00:00Z');
    // Intl met des espaces insécables (« 12 min » ne se coupe pas) : on les remplace pour comparer.
    const ago = (ms: number) =>
      formatTimeAgo(new Date(now.getTime() - ms).toISOString(), now).replace(/\s/g, ' ');
    const minute = 60_000;
    const day = 24 * 60 * minute;
    expect(ago(30_000)).toBe('à l’instant');
    expect(ago(-5 * minute)).toBe('à l’instant'); // date future : horloges décalées
    expect(ago(minute)).toBe('il y a 1 min');
    expect(ago(12 * minute + 59_000)).toBe('il y a 12 min');
    expect(ago(60 * minute)).toBe('il y a 1 h');
    expect(ago(23 * 60 * minute)).toBe('il y a 23 h');
    expect(ago(day)).toBe('hier');
    expect(ago(5 * day)).toBe('il y a 5 jours');
    expect(ago(30 * day)).toBe('il y a 1 mois');
    expect(ago(220 * day)).toBe('il y a 7 mois');
    expect(ago(365 * day)).toBe('il y a 1 an');
    expect(ago(800 * day)).toBe('il y a 2 ans');
  });
});
