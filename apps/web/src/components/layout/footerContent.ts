/**
 * Contenu du pied de page (le même sur toutes les pages). Liens vers les routes existantes.
 */

export interface FooterLink {
  to: string;
  label: string;
}

export const FOOTER_DISCOVER: FooterLink[] = [
  { to: '/', label: 'Accueil' },
  { to: '/recherche', label: 'Prestataires' },
  { to: '/evenements', label: 'Événements' },
  { to: '/offres', label: 'Offres & Deals' },
  { to: '/comment-ca-marche', label: 'Notre mission' },
];

/** « Je suis » : les deux parcours (mêmes destinations que la section « Deux façons d'utiliser Wenzee »). */
export const FOOTER_PROFILES = [
  {
    to: '/devenir-prestataire',
    label: 'Prestataire',
    hint: 'Développez votre activité',
    icon: 'store',
  },
  { to: '/recherche', label: 'Particulier', hint: 'Organisez votre événement', icon: 'calendar' },
] as const;

export const FOOTER_SUPPORT: FooterLink[] = [
  { to: '/comment-ca-marche', label: 'Centre d’aide' },
  { to: '/contact', label: 'Contactez-nous' },
  { to: '/faq', label: 'FAQ' },
];

export const FOOTER_LEGAL: FooterLink[] = [
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/confidentialite', label: 'Politique de confidentialité' },
  { to: '/cgu', label: 'Conditions d’utilisation' },
];

export type SocialNetwork = 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'linkedin';

/**
 * Réseaux sociaux. `url: null` tant que le compte Wenzee n'existe pas : la pastille s'affiche
 * mais n'est pas cliquable (pas de lien vers le compte de quelqu'un d'autre).
 * Pour activer un réseau, il suffit de renseigner son adresse ici.
 */
export const SOCIAL_LINKS: { network: SocialNetwork; label: string; url: string | null }[] = [
  { network: 'instagram', label: 'Instagram', url: null },
  { network: 'tiktok', label: 'TikTok', url: null },
  { network: 'facebook', label: 'Facebook', url: null },
  { network: 'youtube', label: 'YouTube', url: null },
  { network: 'linkedin', label: 'LinkedIn', url: null },
];
