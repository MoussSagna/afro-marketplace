import type { Href } from 'expo-router';

/** L'adresse du profil d'un prestataire (« /prestataires/saveurs-de-dakar », comme sur le site). */
export function profileHref(slug: string): Href {
  return { pathname: '/prestataires/[slug]', params: { slug } };
}
