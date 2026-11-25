/**
 * L'adresse du site Wenzee, pour les pages qui n'existent que là (devenir prestataire, FAQ,
 * pages légales). À régler avec `EXPO_PUBLIC_SITE_URL` ; sinon le domaine de production Vercel
 * supposé (à confirmer par Mouss, voir questions-ouvertes.md n° 14).
 */
export const SITE_URL = (
  process.env.EXPO_PUBLIC_SITE_URL ?? 'https://afromarket.vercel.app'
).replace(/\/$/, '');

/** Les pages du site ouvertes depuis l'app. */
export const SITE_PAGES = {
  becomeProvider: '/devenir-prestataire',
  providerSpace: '/pro',
  legalNotice: '/mentions-legales',
  privacy: '/confidentialite',
  faq: '/faq',
  terms: '/cgu',
} as const;

export function siteUrl(path: string) {
  return `${SITE_URL}${path}`;
}
