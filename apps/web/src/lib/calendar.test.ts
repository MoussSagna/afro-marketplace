import { describe, expect, it } from 'vitest';
import { cursorFromIsoDate, monthGrid, monthLabel, moveMonth, weeks } from './calendar';

describe('grille de calendrier', () => {
  it('commence un lundi : décembre 2026 démarre un mardi (1 case vide)', () => {
    const grid = monthGrid({ year: 2026, month: 11 });
    expect(grid[0]).toBeNull();
    expect(grid[1]).toBe('2026-12-01');
    expect(grid.at(-1)).toBe('2026-12-31');
    expect(weeks(grid)[0]).toHaveLength(7);
  });

  it('passe d’une année à l’autre', () => {
    expect(moveMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(moveMonth(cursorFromIsoDate('2027-01-15'), -1)).toEqual({ year: 2026, month: 11 });
    expect(monthLabel({ year: 2027, month: 0 })).toBe('janvier 2027');
  });
});
