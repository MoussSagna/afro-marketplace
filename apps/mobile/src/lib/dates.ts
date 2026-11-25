/*
 * Les dates des calendriers (recherche, disponibilités), au format ISO « 2026-12-14 » (comme partout dans common).
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

/** Demain, sur le téléphone : le premier jour qu'on peut demander pour un devis. */
export function tomorrowIso(now = new Date()): string {
  return todayIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
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

/** Le premier et le dernier jour d'un mois (« 2026-12-01 » → « 2026-12-31 »), pour demander ses dispos. */
export function monthRange(year: number, month: number): { from: string; to: string } {
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return { from: isoDay(year, month, 1), to: isoDay(year, month, days) };
}

/** « mars 2026 » / « March 2026 » : la date d'un avis. */
export function monthYear(isoDateTime: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(isoDateTime));
}

/**
 * L'heure d'un message, courte comme dans une messagerie (heure du téléphone) :
 * « 14:05 » si c'est aujourd'hui, « 3 déc. » / « 3 Dec » sinon.
 */
export function messageTime(isoDateTime: string, locale: string, now = new Date()): string {
  const date = new Date(isoDateTime);
  const sameDay = todayIso(date) === todayIso(now);
  return new Intl.DateTimeFormat(
    locale,
    sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' },
  ).format(date);
}

/** « 6 déc. » / « 6 Dec » : une date ISO sans heure (fin de validité d'un devis…). */
export function shortDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(noonUtc(iso));
}

/** Le mois abrégé en capitales et le jour, pour une pastille de date : « DÉC. » et « 7 ». */
export function dateBlock(iso: string, locale: string): { month: string; day: string } {
  const date = new Date(`${iso}T00:00:00Z`);
  const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
    .format(date)
    .toLocaleUpperCase(locale);
  return { month, day: String(date.getUTCDate()) };
}
