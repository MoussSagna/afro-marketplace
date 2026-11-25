import { bookingStatus, canCancelBooking, isUpcomingBooking } from './bookingStatus';

describe('bookingStatus', () => {
  it('range les réservations : à venir tant qu’elles sont confirmées ou payées', () => {
    expect(isUpcomingBooking({ status: 'confirmed' })).toBe(true);
    expect(isUpcomingBooking({ status: 'deposit_paid' })).toBe(true);
    expect(isUpcomingBooking({ status: 'completed' })).toBe(false);
    expect(isUpcomingBooking({ status: 'cancelled' })).toBe(false);
  });

  it('autorise l’annulation seulement avant le jour J, sur une réservation confirmée', () => {
    const today = '2026-11-25';
    expect(canCancelBooking({ status: 'confirmed', eventDate: '2026-11-26' }, today)).toBe(true);
    expect(canCancelBooking({ status: 'confirmed', eventDate: '2026-11-25' }, today)).toBe(false);
    expect(canCancelBooking({ status: 'cancelled', eventDate: '2026-12-01' }, today)).toBe(false);
  });

  it('donne le libellé et la couleur du badge', () => {
    expect(bookingStatus({ status: 'confirmed' })).toEqual({ label: 'Confirmée', tone: 'success' });
    expect(bookingStatus({ status: 'completed' })).toEqual({ label: 'Passée', tone: 'muted' });
    expect(bookingStatus({ status: 'disputed' })).toEqual({ label: 'En litige', tone: 'warning' });
  });
});
