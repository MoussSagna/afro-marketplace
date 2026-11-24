/*
 * Les dates de la recherche, au format ISO « 2026-12-14 » (comme partout dans common).
 * On compte en jours du calendrier, sans heure : le jour de l'événement.
 */

/** « 2026-12-14 » à partir d'une année, d'un mois (0 = janvier) et d'un jour. */
export function isoDay(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Aujourd'hui, sur le téléphone (jour local). */
export function todayIso(now = new Date()): string {
  return isoDay(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Une date ISO comme objet Date « à midi UTC », pour l'afficher sans décalage de fuseau. */
function noonUtc(iso: string) {
  return new Date(`${iso}T12:00:00Z`);
}

/** « sam. 14 déc. » / « Sat 14 Dec » : la date courte de la pilule. */
export function shortDay(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(noonUtc(iso));
}

/** « samedi 14 décembre 2026 » : ce que lit VoiceOver sur un jour du calendrier. */
export function longDay(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(noonUtc(iso));
}

/** « décembre 2026 » / « December 2026 », en tête du calendrier. */
export function monthTitle(year: number, month: number, locale: string): string {
  const text = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month, 15)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Les cases d'un mois, semaine par semaine, en commençant le lundi :
 * `null` pour les cases vides avant le 1er, puis les jours (1, 2, 3…).
 */
export function monthGrid(year: number, month: number): (number | null)[] {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0 = dimanche
  const blanks = (first + 6) % 7; // lundi = 0
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
}

/** Les initiales des jours, du lundi au dimanche (« L M M J V S D » / « M T W T F S S »). */
export function weekdayInitials(locale: string): string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' });
  // Le 5 janvier 2026 est un lundi.
  return Array.from({ length: 7 }, (_, i) => format.format(new Date(Date.UTC(2026, 0, 5 + i))));
}
