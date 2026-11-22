import type { Media, Offering, ProviderProfile, ProviderStatus, User } from '../types';
import { allow, deny, type RuleResult } from './ruleResult';

/**
 * Règle n° 1 : seul un utilisateur qui a le rôle « provider » peut avoir un profil prestataire.
 */
export function canHaveProviderProfile(user: Pick<User, 'roles'>): boolean {
  return user.roles.includes('provider');
}

/** Le minimum pour envoyer un profil en validation (règle n° 2). */
export const PROFILE_REQUIREMENTS = {
  minCategories: 1,
  minImages: 3,
  minActiveOfferings: 1,
} as const;

export type ProfileRequirement = 'category' | 'images' | 'offering' | 'city';

/**
 * Règle n° 2 : ce qui manque encore au profil pour être envoyé en validation.
 * Une liste vide veut dire « complet ». Pratique pour afficher une checklist dans l'onboarding.
 */
export function getMissingProfileRequirements(
  profile: Pick<ProviderProfile, 'categoryIds' | 'city'>,
  media: ReadonlyArray<Pick<Media, 'type'>>,
  offerings: ReadonlyArray<Pick<Offering, 'isActive'>>,
): { requirement: ProfileRequirement; message: string }[] {
  const missing: { requirement: ProfileRequirement; message: string }[] = [];
  const imageCount = media.filter((m) => m.type === 'image').length;

  if (profile.categoryIds.length < PROFILE_REQUIREMENTS.minCategories) {
    missing.push({ requirement: 'category', message: 'Choisis au moins une catégorie' });
  }
  if (imageCount < PROFILE_REQUIREMENTS.minImages) {
    const remaining = PROFILE_REQUIREMENTS.minImages - imageCount;
    missing.push({
      requirement: 'images',
      message: `Ajoute encore ${remaining} photo${remaining > 1 ? 's' : ''} (3 minimum)`,
    });
  }
  if (offerings.filter((o) => o.isActive).length < PROFILE_REQUIREMENTS.minActiveOfferings) {
    missing.push({ requirement: 'offering', message: 'Ajoute au moins une formule active' });
  }
  if (profile.city.trim() === '') {
    missing.push({ requirement: 'city', message: 'Indique ta ville' });
  }
  return missing;
}

/**
 * Les changements de statut autorisés (le diagramme d'états de l'étape 2, en code).
 * Tout ce qui n'est pas listé ici est interdit.
 */
const PROVIDER_TRANSITIONS: Record<ProviderStatus, readonly ProviderStatus[]> = {
  draft: ['pending_review'],
  pending_review: ['published', 'changes_requested', 'rejected'],
  changes_requested: ['pending_review'],
  published: ['paused', 'suspended'],
  paused: ['published'],
  suspended: ['published'],
  rejected: [],
};

export function canChangeProviderStatus(from: ProviderStatus, to: ProviderStatus): boolean {
  return PROVIDER_TRANSITIONS[from].includes(to);
}

export type SubmitProfileDenial = 'invalid_status' | 'incomplete_profile';

/**
 * Règle n° 2 complète : le prestataire peut-il envoyer son profil en validation ?
 * Il faut à la fois un statut qui le permet ET un profil complet.
 */
export function canSubmitProfileForReview(
  profile: Pick<ProviderProfile, 'status' | 'categoryIds' | 'city'>,
  media: ReadonlyArray<Pick<Media, 'type'>>,
  offerings: ReadonlyArray<Pick<Offering, 'isActive'>>,
): RuleResult<SubmitProfileDenial> {
  if (!canChangeProviderStatus(profile.status, 'pending_review')) {
    return deny('invalid_status', 'Ce profil ne peut pas être envoyé en validation maintenant.');
  }
  const missing = getMissingProfileRequirements(profile, media, offerings);
  if (missing.length > 0) {
    return deny('incomplete_profile', missing.map((m) => m.message).join(' · '));
  }
  return allow();
}

/** Seuls les profils publiés apparaissent dans la recherche et peuvent recevoir des demandes. */
export function isProviderPublic(profile: Pick<ProviderProfile, 'status'>): boolean {
  return profile.status === 'published';
}
