/*
 * Petits outils de dates, sans bibliothèque.
 *
 * Convention du projet : un « jour » (date d'événement, date bloquée…) est une
 * chaîne ISO « AAAA-MM-JJ ». Tous les calculs se font en UTC pour éviter les
 * surprises de fuseau horaire et de changement d'heure.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Date JavaScript → « 2026-12-31 » (jour UTC). */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** « 2026-12-31 » → Date à minuit UTC. */
export function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/** Ajoute (ou retire, si négatif) des jours à un jour ISO. */
export function addDays(isoDate: string, days: number): string {
  return toIsoDate(new Date(parseIsoDate(isoDate).getTime() + days * MS_PER_DAY));
}

/** Ajoute des jours à une date-heure, renvoie une date-heure ISO complète. */
export function addDaysToDateTime(date: Date, days: number): string {
  return new Date(date.getTime() + days * MS_PER_DAY).toISOString();
}

/**
 * Nombre de jours entiers entre deux jours ISO (positif si `to` est après `from`).
 * daysBetween('2026-12-01', '2026-12-31') → 30.
 */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / MS_PER_DAY);
}
