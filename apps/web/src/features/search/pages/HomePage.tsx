import { useCategories, useFeaturedProviders } from '@afro/common';
import { motion } from 'motion/react';
import { useLocation } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { ExploreCategoriesSection } from '@/features/home/components/ExploreCategoriesSection';
import { HeroSection } from '@/features/home/components/HeroSection';
import { usePageMeta } from '@/hooks/usePageMeta';
import { HowItWorks } from '../components/HowItWorks';
import { ProviderCard } from '../components/ProviderCard';

/**
 * P1 : l'accueil. Hero plein écran (recherche, catégories, carrousel), « Explorez nos univers »,
 * prestataires à la une, comment ça marche.
 */
export function HomePage() {
  usePageMeta(
    'Prestataires afro pour vos événements',
    'Traiteurs, danseurs, DJ, speakers, coiffeuses… Trouvez un prestataire afro en Île-de-France et demandez un devis gratuit.',
  );
  const providers = useFeaturedProviders();
  // Après la suppression du compte (C8), on confirme ici que c'est fait.
  const accountDeleted = (useLocation().state as { accountDeleted?: boolean } | null)
    ?.accountDeleted;
  const categories = useCategories();

  const categoryName = (id: string | undefined) =>
    categories.data?.find((category) => category.id === id)?.name;

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

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="featured-title">
        <h2 id="featured-title" className="mb-6 font-display text-2xl font-semibold">
          Prestataires à la une
        </h2>

        {providers.isPending && (
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label="Chargement"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-72 rounded-xl" />
            ))}
          </div>
        )}

        {providers.isError && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
            Impossible de charger les prestataires pour le moment. Réessayez dans un instant.
          </p>
        )}

        {providers.isSuccess && (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {providers.data.map((provider, index) => (
              <motion.li
                key={provider.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <ProviderCard
                  provider={provider}
                  categoryName={categoryName(provider.categoryIds[0])}
                />
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <HowItWorks />
    </>
  );
}
