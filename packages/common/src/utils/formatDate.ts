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

// Court pour les minutes et les heures (« il y a 12 min »), en toutes lettres au-delà (« il y a 2 mois »).
const shortRelative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto', style: 'short' });
const longRelative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
const longRelativeNumbers = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'always' });
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Le temps écoulé, court : « à l’instant », « il y a 12 min », « il y a 3 h », « hier »,
 * « il y a 5 jours », « il y a 2 mois », « il y a 1 an ». Une date future (horloges décalées)
 * compte comme « à l’instant ».
 */
export function formatTimeAgo(isoDateTime: string, now: Date = new Date()): string {
  const elapsed = now.getTime() - new Date(isoDateTime).getTime();
  if (elapsed < MINUTE) return 'à l’instant';
  if (elapsed < HOUR) return shortRelative.format(-Math.floor(elapsed / MINUTE), 'minute');
  if (elapsed < DAY) return shortRelative.format(-Math.floor(elapsed / HOUR), 'hour');
  const days = Math.floor(elapsed / DAY);
  if (days < 30) return longRelative.format(-days, 'day');
  if (days < 365) return longRelativeNumbers.format(-Math.floor(days / 30), 'month');
  return longRelativeNumbers.format(-Math.floor(days / 365), 'year');
}
