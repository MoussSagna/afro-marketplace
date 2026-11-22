import type { ComponentType } from 'react';
import {
  AreaSection,
  AvailabilitySection,
  CategoriesSection,
  IdentitySection,
  OfferingsSection,
  PolicySection,
  PresentationSection,
  type SectionProps,
} from '../components/ProfileSections';

export interface ProfileStep {
  key: string;
  title: string;
  description: string;
  Section: ComponentType<SectionProps>;
}

/**
 * Les étapes de l'onboarding (S1), dans l'ordre. Les mêmes sections forment
 * les onglets de « Modifier mon profil » (S7). Le récapitulatif (envoi en
 * validation) vient après la dernière : c'est l'étape n° STEPS.length + 1.
 */
export const PROFILE_STEPS: readonly ProfileStep[] = [
  {
    key: 'identite',
    title: 'Qui es-tu ?',
    description: 'Ton nom commercial et ton statut.',
    Section: IdentitySection,
  },
  {
    key: 'categories',
    title: 'Ce que tu proposes',
    description: 'Tes catégories, tes cultures et les langues que tu parles.',
    Section: CategoriesSection,
  },
  {
    key: 'zone',
    title: 'Où interviens-tu ?',
    description: 'Ta ville et la distance que tu acceptes de parcourir.',
    Section: AreaSection,
  },
  {
    key: 'presentation',
    title: 'Présentation et photos',
    description: 'Donne envie : 3 photos minimum et quelques mots sur toi.',
    Section: PresentationSection,
  },
  {
    key: 'formules',
    title: 'Tes formules',
    description: 'Tes prestations types et leurs prix, pour aider les clients à se projeter.',
    Section: OfferingsSection,
  },
  {
    key: 'disponibilites',
    title: 'Tes disponibilités',
    description: 'Combien d’événements tu peux assurer le même jour.',
    Section: AvailabilitySection,
  },
  {
    key: 'annulation',
    title: 'Conditions d’annulation',
    description: 'Ce que le client récupère de son acompte s’il annule.',
    Section: PolicySection,
  },
];

export const SUMMARY_STEP = PROFILE_STEPS.length + 1;

/** L'étape où reprendre : celle enregistrée, ramenée entre 1 et le récapitulatif. */
export function resumeStep(onboardingStep: number): number {
  return Math.min(Math.max(onboardingStep, 1), SUMMARY_STEP);
}
