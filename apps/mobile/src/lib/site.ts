/**
 * L'adresse du site Wenzee, pour les pages qui n'existent que là (devenir prestataire, FAQ,
 * pages légales). À régler avec `EXPO_PUBLIC_SITE_URL`. En attendant le vrai domaine, une adresse
 * fictive (`wenzee.example`, réservée aux exemples) : à changer, voir questions-ouvertes.md n° 14.
 */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://wenzee.example').replace(
  /\/$/,
  '',
);

/** Les pages du site ouvertes depuis l'app. */
export const SITE_PAGES = {
  becomeProvider: '/devenir-prestataire',
  /** « Mon profil » de l'espace pro : les sections du profil s'y modifient (en attendant le lot M15c). */
  providerProfile: '/pro/profil',
  legalNotice: '/mentions-legales',
  privacy: '/confidentialite',
  faq: '/faq',
  terms: '/cgu',
} as const;

export function siteUrl(path: string) {
  return `${SITE_URL}${path}`;
}
