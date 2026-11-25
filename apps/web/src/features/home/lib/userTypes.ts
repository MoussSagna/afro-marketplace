/** Une des deux façons d'utiliser Wenzee (carte de la section « Deux façons d'utiliser Wenzee »). */
export interface UserType {
  id: 'provider' | 'client';
  badge: string;
  /** Titre en deux parties : la seconde est mise en valeur (couleur d'accent). */
  title: { start: string; accent: string };
  description: string;
  features: string[];
  cta: { label: string; to: string; variant: 'default' | 'cta' };
  /** « Déjà inscrit ? Se connecter » : où revenir après la connexion. */
  loginTo: string;
  illustration: 'store' | 'calendar';
  /** Côté de l'illustration dans la carte (grand écran et tablette). */
  illustrationSide: 'left' | 'right';
}

/**
 * Les deux parcours. Liens vers les routes existantes :
 * - prestataire : `/devenir-prestataire` (P6, puis l'onboarding), connexion avec retour vers l'espace pro ;
 * - particulier : la recherche, connexion simple (on arrive dans son espace).
 */
export const USER_TYPES: UserType[] = [
  {
    id: 'provider',
    badge: 'Pour les prestataires',
    title: { start: 'Développez', accent: 'votre activité.' },
    description:
      'Gagnez en visibilité, trouvez de nouveaux clients et faites grandir votre business.',
    features: [
      'Créez votre vitrine et présentez vos services',
      'Recevez des demandes qualifiées',
      'Collectez des avis et renforcez votre réputation',
      'Gérez vos prestations et vos disponibilités',
      'Promouvez vos offres et événements',
    ],
    cta: { label: 'Référencer mon activité', to: '/devenir-prestataire', variant: 'default' },
    loginTo: '/connexion?retour=%2Fpro',
    illustration: 'store',
    illustrationSide: 'left',
  },
  {
    id: 'client',
    badge: 'Pour les particuliers',
    title: { start: 'Trouvez les', accent: 'bons prestataires.' },
    description: 'Organisez vos événements en toute sérénité avec des professionnels de confiance.',
    features: [
      'Recherchez par catégorie, ville ou date',
      'Comparez les profils, services et avis',
      'Enregistrez vos prestataires favoris',
      'Échangez directement avec eux',
      'Planifiez facilement votre événement',
    ],
    cta: { label: 'Organiser mon événement', to: '/recherche', variant: 'cta' },
    loginTo: '/connexion',
    illustration: 'calendar',
    illustrationSide: 'right',
  },
];
