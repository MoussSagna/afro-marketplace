import type { ProviderCard, ProviderProfile, PublicUser, User } from '../types';

/*
 * Transformations « base → réponse de l'API ».
 * Le vrai back-end fera la même chose : il ne renvoie jamais une ligne de
 * table telle quelle, il choisit ce qu'on a le droit de voir.
 */

export function toProviderCard(profile: ProviderProfile): ProviderCard {
  return {
    id: profile.id,
    slug: profile.slug,
    displayName: profile.displayName,
    coverUrl: profile.coverUrl,
    city: profile.city,
    categoryIds: profile.categoryIds,
    culturalOriginIds: profile.culturalOriginIds,
    priceFrom: profile.priceFrom,
    ratingAverage: profile.ratingAverage,
    ratingCount: profile.ratingCount,
    isProVerified: profile.isProVerified,
  };
}

/** Ce qu'on montre d'un utilisateur aux autres : prénom et initiale du nom. */
export function toPublicUser(
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'status'>,
): PublicUser {
  // Compte supprimé (RGPD) : on garde l'historique mais plus aucune information personnelle.
  if (user.status === 'deleted') {
    return { id: user.id, firstName: 'Compte supprimé', lastNameInitial: '' };
  }
  return {
    id: user.id,
    firstName: user.firstName,
    lastNameInitial: `${user.lastName.charAt(0)}.`,
    avatarUrl: user.avatarUrl,
  };
}
