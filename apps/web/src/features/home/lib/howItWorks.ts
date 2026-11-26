import { MessageSquareText, PartyPopper, Search, type LucideIcon } from 'lucide-react';

export interface HowItWorksStep {
  icon: LucideIcon;
  title: string;
  text: string;
}

/** Les 3 étapes de « Comment ça marche » (textes de la maquette `maquette-accueil/`). */
export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    icon: Search,
    title: 'Cherchez',
    text: 'Filtrez par catégorie, ville, budget et date. Parcourez photos, tarifs et avis.',
  },
  {
    icon: MessageSquareText,
    title: 'Demandez un devis',
    text: 'Décrivez votre événement une fois. Les prestataires vous répondent avec une offre claire.',
  },
  {
    icon: PartyPopper,
    title: 'Célébrez',
    text: 'Acceptez le devis qui vous plaît, profitez du jour J, puis laissez un avis.',
  },
];
