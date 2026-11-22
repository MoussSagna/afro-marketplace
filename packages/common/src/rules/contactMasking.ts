import type { BookingStatus } from '../types';

/** Ce qui remplace un téléphone ou un email masqué. */
export const MASKED_CONTACT_PLACEHOLDER = '[coordonnées masquées]';

// Un email classique : « awa.diallo@mail.fr ».
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

// Un email « déguisé » : « awa at mail point fr », « awa (arobase) mail.fr ».
const DISGUISED_EMAIL =
  /[A-Z0-9._%+-]+\s*[([]?\s*(?:at|arobase)\s*[)\]]?\s*[A-Z0-9-]+\s*(?:\.|[([]?\s*(?:dot|point)\s*[)\]]?)\s*[A-Z]{2,}/gi;

// Un téléphone : au moins 9 chiffres, éventuellement séparés par des espaces,
// points, tirets ou slashs, avec un indicatif « +33 » ou « 0033 » facultatif.
// Couvre « 06 12 34 56 78 », « 06.12.34.56.78 », « +33 6 12 34 56 78 », « 0612345678 ».
const PHONE = /(?:\+|00)?\d(?:[\s./-]?\d){8,}/g;

/**
 * Règle n° 7 : masque les téléphones et emails d'un message.
 * Renvoie le texte nettoyé, et si quelque chose a été masqué (pour prévenir l'auteur).
 *
 * Ce n'est pas infaillible (on peut toujours écrire « zéro six… ») : le but est
 * de décourager, pas de tout bloquer. Le bouton « Signaler » complète le dispositif.
 */
export function maskContactDetails(text: string): { text: string; hasMaskedContent: boolean } {
  const masked = text
    .replace(EMAIL, MASKED_CONTACT_PLACEHOLDER)
    .replace(DISGUISED_EMAIL, MASKED_CONTACT_PLACEHOLDER)
    .replace(PHONE, MASKED_CONTACT_PLACEHOLDER);
  return { text: masked, hasMaskedContent: masked !== text };
}

/** Les statuts de réservation qui lèvent le masquage : les deux parties sont engagées. */
const UNMASKING_BOOKING_STATUSES: readonly BookingStatus[] = [
  'confirmed',
  'deposit_paid',
  'fully_paid',
  'completed',
];

/**
 * Faut-il masquer les coordonnées dans cette conversation ?
 * Oui tant qu'il n'y a pas de réservation confirmée (pas de réservation, ou réservation annulée).
 */
export function shouldMaskContactDetails(bookingStatus: BookingStatus | undefined): boolean {
  return bookingStatus === undefined || !UNMASKING_BOOKING_STATUSES.includes(bookingStatus);
}
