import { describe, expect, it } from 'vitest';
import { upcomingBookings } from './upcomingBookings';

const make = (id: string, status: string, eventDate: string) =>
  ({ booking: { id, status, eventDate } }) as unknown as Parameters<
    typeof upcomingBookings
  >[0][number];

describe('upcomingBookings', () => {
  it('garde les réservations confirmées à partir d’aujourd’hui', () => {
    const list = [
      make('a', 'confirmed', '2026-11-27'),
      make('b', 'confirmed', '2026-11-26'),
      make('c', 'cancelled', '2026-12-10'),
      make('d', 'completed', '2026-12-10'),
      make('e', 'confirmed', '2027-02-10'),
    ];
    expect(upcomingBookings(list, '2026-11-27').map((b) => b.booking.id)).toEqual(['a', 'e']);
  });
});
