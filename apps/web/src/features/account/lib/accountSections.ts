import { Bell, Heart, Shield, UserRound, type LucideIcon } from 'lucide-react';

export type AccountSectionId = 'informations' | 'notifications' | 'securite' | 'preferences';

export interface AccountSection {
  /** La valeur de `?rubrique=` dans l'adresse (`informations` : sans paramètre). */
  id: AccountSectionId;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Les rubriques de « Mon compte », dans l'ordre du menu. La rubrique affichée vit dans
 * l'adresse (`/espace/compte?rubrique=securite`), comme `?onglet=` sur « Mes demandes » :
 * on peut partager le lien, et « retour » revient à la rubrique précédente.
 */
export const ACCOUNT_SECTIONS: readonly AccountSection[] = [
  {
    id: 'informations',
    label: 'Informations personnelles',
    title: 'Informations personnelles',
    description: 'Mettez à jour vos informations de base.',
    icon: UserRound,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    title: 'Notifications',
    description: 'Choisissez comment vous souhaitez être informé.',
    icon: Bell,
  },
  {
    id: 'securite',
    label: 'Sécurité',
    title: 'Sécurité',
    description: 'Gérez la sécurité et l’accès à votre compte.',
    icon: Shield,
  },
  {
    id: 'preferences',
    label: 'Préférences',
    title: 'Préférences',
    description: 'Personnalisez votre expérience sur Wenzee.',
    icon: Heart,
  },
];

export const DEFAULT_ACCOUNT_SECTION: AccountSection = ACCOUNT_SECTIONS[0]!;

/** La rubrique demandée par l'adresse ; une valeur inconnue revient à la première. */
export function accountSectionFrom(value: string | null): AccountSection {
  return ACCOUNT_SECTIONS.find((section) => section.id === value) ?? DEFAULT_ACCOUNT_SECTION;
}

/** L'adresse d'une rubrique (la première n'a pas de paramètre). */
export function accountSectionHref(id: AccountSectionId): string {
  return id === DEFAULT_ACCOUNT_SECTION.id ? '/espace/compte' : `/espace/compte?rubrique=${id}`;
}

/** « Membre depuis mars 2025 » : le mois et l'année d'inscription (date ISO UTC). */
export function memberSince(createdAt: string): string {
  const label = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(createdAt));
  return `Membre depuis ${label}`;
}

/** Les initiales affichées quand il n'y a pas de photo (« AN »). */
export function initialsOf(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
