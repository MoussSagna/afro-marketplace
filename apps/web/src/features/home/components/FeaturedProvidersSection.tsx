import { useCategories, useFeaturedProviders } from '@afro/common';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FeaturedProviderCard } from './FeaturedProviderCard';

/**
 * 4ᵉ section de l'accueil : « Prestataires à la une ».
 * Même grammaire que les sections au-dessus : surtitre entre tirets, grand titre Playfair avec
 * mot accent souligné, bouton d'action. Grille de cartes : 1 colonne (téléphone), 2 (tablette),
 * 4 (ordinateur). Fond ivoire : il alterne avec le sable de « Deux façons d'utiliser Wenzee ».
 */
export function FeaturedProvidersSection() {
  const providers = useFeaturedProviders();
  const categories = useCategories();
  const categoryName = (id: string | undefined) =>
    categories.data?.find((category) => category.id === id)?.name;

  return (
    <section aria-labelledby="featured-title" className="bg-background">
      <div className="mx-auto max-w-[1539px] px-4 py-16 sm:px-6 lg:px-8 lg:py-[93px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-3 text-sm font-bold tracking-[0.08em] text-primary uppercase lg:text-[17px]">
              <span aria-hidden className="h-0.5 w-7 shrink-0 bg-primary" />
              Prestataires à la une
            </p>
            <h2
              id="featured-title"
              className="mt-4 font-display text-4xl leading-[1.08] font-bold tracking-[-0.01em] sm:text-5xl lg:text-[52px] lg:leading-[1]"
            >
              Des talents qui font{' '}
              <span className="relative inline-block text-title-accent">
                la différence.
                <svg
                  aria-hidden
                  className="absolute -bottom-3 left-[8%] h-3 w-[90%] text-ochre"
                  viewBox="0 0 500 16"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <path
                    d="M3 12 C 140 3, 330 1, 497 9"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
          </div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 self-start px-6 text-base font-semibold lg:self-auto"
          >
            <Link to="/recherche">
              Voir tous les prestataires
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="mt-10 lg:mt-14">
          {providers.isPending && (
            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
              role="status"
              aria-label="Chargement"
            >
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-80 rounded-2xl" />
              ))}
            </div>
          )}

          {providers.isError && (
            <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
              Impossible de charger les prestataires pour le moment. Réessayez dans un instant.
            </p>
          )}

          {providers.isSuccess && (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {providers.data.map((provider, index) => (
                <motion.li
                  key={provider.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                >
                  <FeaturedProviderCard
                    provider={provider}
                    categoryName={categoryName(provider.categoryIds[0])}
                  />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
