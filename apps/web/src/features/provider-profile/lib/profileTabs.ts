/** Les 4 onglets de la fiche prestataire, dans l'ordre d'affichage. */
export const PROFILE_TABS = ['presentation', 'prestations', 'galerie', 'avis'] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];
