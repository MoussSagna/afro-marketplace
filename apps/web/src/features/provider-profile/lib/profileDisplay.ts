import type { Offering } from '@afro/common';

/**
 * Petites fonctions d'affichage de la fiche prestataire (P5).
 * Pures (l'heure courante est un paramètre) : testées dans `profileDisplay.test.ts`.
 */

export interface RatingBucket {
  stars: 1 | 2 | 3 | 4 | 5;
  count: number;
  /** Part des avis, arrondie à l'entier (0 à 100). */
  percent: number;
}

/** La répartition des notes, de 5 à 1 étoile (une note décimale compte pour l'étoile arrondie). */
export function ratingDistribution(ratings: number[]): RatingBucket[] {
  const total = ratings.length;
  return ([5, 4, 3, 2, 1] as const).map((stars) => {
    const count = ratings.filter((rating) => Math.round(rating) === stars).length;
    return { stars, count, percent: total === 0 ? 0 : Math.round((count / total) * 100) };
  });
}

const relativeFormatter = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** « il y a 2 mois », « hier », « à l'instant »… */
export function timeAgo(isoDateTime: string, now: Date): string {
  const seconds = (new Date(isoDateTime).getTime() - now.getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size)
      return relativeFormatter.format(Math.round(seconds / size), unit);
  }
  return 'à l’instant';
}

/** Le délai de réponse moyen : « 3 h » sous 24 h, sinon en jours (« 2 j »). */
export function formatResponseTime(hours: number): string {
  return hours < 24 ? `${Math.max(1, Math.round(hours))} h` : `${Math.round(hours / 24)} j`;
}

/** Le plus grand nombre d'invités accepté par les formules, s'il est renseigné. */
export function maxGuestsOf(offerings: Offering[]): number | undefined {
  const values = offerings.map((offering) => offering.maxGuests).filter((n) => n !== undefined);
  return values.length > 0 ? Math.max(...values) : undefined;
}

/**
 * Le monogramme qui remplace le logo (le profil n'a pas de logo) : les initiales des deux premiers
 * mots de plus de 2 lettres. « Saveurs de Dakar » → « SD », « Le Mafé Truck » → « MT ».
 */
export function monogram(name: string): string {
  const words = name.split(/[\s,-]+/).filter((word) => word.length > 2 && /^\p{L}/u.test(word));
  const initials = words.slice(0, 2).map((word) => word[0]!.toUpperCase());
  return initials.join('') || name.trim().charAt(0).toUpperCase() || '?';
}
