import type { Booking, BookingSummary } from '../types';
import type { MockData } from './data';
import type { MockDb } from './db';
import { toProviderCard, toPublicUser } from './mappers';

/**
 * Passage automatique « confirmed → completed » une fois la date passée.
 * Comme pour l'expiration des demandes, le vrai back-end le fera avec une tâche
 * planifiée ; la base mockée le vérifie à chaque lecture.
 */
export function completePastBookings(db: MockDb): void {
  const today = db.now().toISOString().slice(0, 10);
  let changed = false;
  for (const booking of db.data.bookings) {
    if (booking.status === 'confirmed' && booking.eventDate < today) {
      booking.status = 'completed';
      booking.updatedAt = db.now().toISOString();
      changed = true;
    }
  }
  if (changed) db.save();
}

/** Une réservation avec le prestataire et le client, pour les listes. */
export function toBookingSummary(data: MockData, booking: Booking): BookingSummary {
  const provider = data.providers.find((p) => p.id === booking.providerId)!;
  const client = data.users.find((u) => u.id === booking.clientId)!;
  return { booking, provider: toProviderCard(provider), client: toPublicUser(client) };
}
