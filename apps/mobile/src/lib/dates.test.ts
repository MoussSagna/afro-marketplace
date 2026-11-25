import { messageTime, monthGrid, monthRange, monthYear, shortDate } from './dates';

describe('dates des calendriers', () => {
  it('donne le premier et le dernier jour d’un mois', () => {
    expect(monthRange(2026, 11)).toEqual({ from: '2026-12-01', to: '2026-12-31' });
    expect(monthRange(2028, 1)).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('commence la grille du mois un lundi', () => {
    // Le 1er décembre 2026 est un mardi : une case vide avant.
    expect(monthGrid(2026, 11).slice(0, 2)).toEqual([null, 1]);
  });

  it('écrit le mois d’un avis', () => {
    expect(monthYear('2026-03-14T10:00:00Z', 'fr-FR')).toBe('mars 2026');
    expect(monthYear('2026-03-14T10:00:00Z', 'en-GB')).toBe('March 2026');
  });

  it('écrit l’heure d’un message : l’heure aujourd’hui, la date sinon', () => {
    const now = new Date(2026, 10, 25, 18, 0);
    const today = new Date(2026, 10, 25, 14, 5).toISOString();
    const before = new Date(2026, 11 - 9, 3, 9, 0).toISOString(); // 3 mars
    expect(messageTime(today, 'fr-FR', now)).toBe('14:05');
    expect(messageTime(before, 'fr-FR', now)).toBe('3 mars');
    expect(shortDate('2026-12-06', 'fr-FR')).toBe('6 déc.');
    expect(shortDate('2026-12-06', 'en-GB')).toBe('6 Dec');
  });
});
