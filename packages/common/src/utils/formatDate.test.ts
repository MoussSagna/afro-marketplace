import { describe, expect, it } from 'vitest';
import { formatDateTime, formatEventDate, formatMessageTime } from './formatDate';

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
});
