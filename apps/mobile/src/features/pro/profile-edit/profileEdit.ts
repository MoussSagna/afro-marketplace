import type { Href } from 'expo-router';

/** Les sections du profil qui se modifient dans l'app (lot M15c), par leur nom dans l'adresse. */
export const PROFILE_SECTIONS = {
  presentation: 'proProfile.presentation',
  zone: 'proProfile.zone',
  annulation: 'proProfile.cancellation',
  legal: 'proProfile.legal',
} as const;
export type ProfileSection = keyof typeof PROFILE_SECTIONS;

export const isProfileSection = (value: string): value is ProfileSection =>
  Object.prototype.hasOwnProperty.call(PROFILE_SECTIONS, value);

/** L'adresse du formulaire d'une section (« /pro/modifier/zone »). */
export const sectionHref = (section: ProfileSection): Href => ({
  pathname: '/pro/modifier/[section]',
  params: { section },
});

/** L'adresse du formulaire d'une formule (« nouvelle » pour en ajouter une). */
export const offeringHref = (id = 'nouvelle'): Href => ({
  pathname: '/pro/formules/[id]',
  params: { id },
});

/** Ajoute ou retire une valeur d'une liste (choix multiple), sans dépasser `max`. */
export function toggle(list: string[], value: string, max = Infinity): string[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return list.length >= max ? list : [...list, value];
}
