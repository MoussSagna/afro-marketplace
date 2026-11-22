/*
 * Affichage des dates en français, à l'heure de Paris.
 * En base, tout est en UTC (ISO) ; on ne convertit qu'au moment d'afficher.
 */
const TIME_ZONE = 'Europe/Paris';

const eventDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: TIME_ZONE,
});
const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
});
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE });

/** Une date d'événement « 2027-06-12 » → « samedi 12 juin 2027 ». */
export function formatEventDate(isoDate: string): string {
  return eventDateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

/**
 * L'heure d'un message, courte comme dans une messagerie :
 * « 14:05 » si c'est aujourd'hui, « 3 déc. » sinon.
 */
export function formatMessageTime(isoDateTime: string, now: Date = new Date()): string {
  const date = new Date(isoDateTime);
  return dayKeyFormatter.format(date) === dayKeyFormatter.format(now)
    ? timeFormatter.format(date)
    : shortDateFormatter.format(date);
}

/** « 3 déc. à 14:05 », pour un horodatage complet. */
export function formatDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return `${shortDateFormatter.format(date)} à ${timeFormatter.format(date)}`;
}
