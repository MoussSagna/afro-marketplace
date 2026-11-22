import { toIsoDate } from '@afro/common';

/*
 * Petits outils pour afficher un mois en grille (calendrier du profil P5, agenda S6).
 * Les dates sont des jours « AAAA-MM-JJ » : on calcule en UTC pour éviter les
 * décalages d'un jour liés au fuseau horaire.
 */

export const WEEK_DAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

export const monthFormatter = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const dayFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

export interface MonthCursor {
  year: number;
  /** De 0 (janvier) à 11 (décembre), comme en JavaScript. */
  month: number;
}

export function cursorFromIsoDate(date: string): MonthCursor {
  const [year, month] = date.split('-').map(Number);
  return { year: year!, month: month! - 1 };
}

export function moveMonth({ year, month }: MonthCursor, step: number): MonthCursor {
  const date = new Date(Date.UTC(year, month + step, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

/** Les jours d'un mois, précédés de cases vides pour commencer un lundi. */
export function monthGrid({ year, month }: MonthCursor): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // lundi = 0
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    toIsoDate(new Date(Date.UTC(year, month, i + 1))),
  );
  return [...Array<null>(offset).fill(null), ...days];
}

/** Découpe la grille en semaines de 7 cases. */
export function weeks<T>(days: T[]): T[][] {
  return Array.from({ length: Math.ceil(days.length / 7) }, (_, i) => days.slice(i * 7, i * 7 + 7));
}

export const monthLabel = ({ year, month }: MonthCursor) =>
  monthFormatter.format(new Date(Date.UTC(year, month, 1)));

export const dayLabel = (day: string) => dayFormatter.format(new Date(`${day}T00:00:00Z`));
