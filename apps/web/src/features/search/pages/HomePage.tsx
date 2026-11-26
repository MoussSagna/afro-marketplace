import { useLocation } from 'react-router';
import { FeaturedProvidersSection } from '@/features/home/components/FeaturedProvidersSection';
import { ExploreCategoriesSection } from '@/features/home/components/ExploreCategoriesSection';
import { HeroSection } from '@/features/home/components/HeroSection';
import { HowItWorksSection } from '@/features/home/components/HowItWorksSection';
import { UserTypesSection } from '@/features/home/components/UserTypesSection';
import { WhyWenzeeSection } from '@/features/home/components/WhyWenzeeSection';
import { usePageMeta } from '@/hooks/usePageMeta';

/**
 * P1 : l'accueil. Hero plein écran (recherche, catégories, carrousel), « Explorez nos univers »,
 * « Deux façons d'utiliser Wenzee », prestataires à la une, comment ça marche, pourquoi Wenzee.
 */
export function HomePage() {
  usePageMeta(
    'Prestataires afro pour vos événements',
    'Traiteurs, danseurs, DJ, speakers, coiffeuses… Trouvez un prestataire afro en Île-de-France et demandez un devis gratuit.',
  );
  // Après la suppression du compte (C8), on confirme ici que c'est fait.
  const accountDeleted = (useLocation().state as { accountDeleted?: boolean } | null)
    ?.accountDeleted;
  return (
    <>
      <HeroSection
        notice={
          accountDeleted && (
            <p
              role="status"
              className="mb-6 self-center rounded-full bg-background px-4 py-2 text-sm text-foreground"
            >
              Ton compte a bien été supprimé. Merci d’avoir utilisé Wenzee.
            </p>
          )
        }
      />

      <ExploreCategoriesSection />

      <UserTypesSection />

      <FeaturedProvidersSection />

      <HowItWorksSection />

      <WhyWenzeeSection />
    </>
  );
}
