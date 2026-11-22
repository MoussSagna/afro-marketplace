/**
 * Règle métier n° 3 (étape 2) : un prestataire est-il disponible un jour donné ?
 *
 * Par défaut, un prestataire est disponible. Il ne l'est pas si :
 * - il a bloqué la date à la main (raison « manual ») ;
 * - ou le nombre de réservations ce jour-là atteint son maximum par jour.
 *
 * C'est une fonction pure : pas d'appel réseau, pas d'état. Facile à tester,
 * et partagée par le web, le mobile et la base mockée.
 */
export interface AvailabilityInput {
  maxBookingsPerDay: number;
  unavailabilities: ReadonlyArray<{ date: string; reason: 'manual' | 'booking' }>;
}

export function isProviderAvailable(provider: AvailabilityInput, date: string): boolean {
  const sameDay = provider.unavailabilities.filter((u) => u.date === date);

  if (sameDay.some((u) => u.reason === 'manual')) {
    return false;
  }

  const bookingsThatDay = sameDay.filter((u) => u.reason === 'booking').length;
  return bookingsThatDay < provider.maxBookingsPerDay;
}
