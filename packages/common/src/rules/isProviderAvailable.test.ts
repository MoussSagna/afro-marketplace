import { describe, expect, it } from 'vitest';
import { isProviderAvailable } from './isProviderAvailable';

const DAY = '2026-12-31';

describe('isProviderAvailable', () => {
  it('est disponible par défaut', () => {
    expect(isProviderAvailable({ maxBookingsPerDay: 1, unavailabilities: [] }, DAY)).toBe(true);
  });

  it("n'est pas disponible si la date est bloquée à la main", () => {
    const provider = {
      maxBookingsPerDay: 3,
      unavailabilities: [{ date: DAY, reason: 'manual' as const }],
    };
    expect(isProviderAvailable(provider, DAY)).toBe(false);
  });

  it("n'est pas disponible quand le maximum de réservations du jour est atteint", () => {
    const provider = {
      maxBookingsPerDay: 2,
      unavailabilities: [
        { date: DAY, reason: 'booking' as const },
        { date: DAY, reason: 'booking' as const },
      ],
    };
    expect(isProviderAvailable(provider, DAY)).toBe(false);
  });

  it('reste disponible tant que le maximum du jour n’est pas atteint', () => {
    const provider = {
      maxBookingsPerDay: 2,
      unavailabilities: [{ date: DAY, reason: 'booking' as const }],
    };
    expect(isProviderAvailable(provider, DAY)).toBe(true);
  });

  it('ignore les blocages des autres jours', () => {
    const provider = {
      maxBookingsPerDay: 1,
      unavailabilities: [{ date: '2026-12-30', reason: 'manual' as const }],
    };
    expect(isProviderAvailable(provider, DAY)).toBe(true);
  });
});
