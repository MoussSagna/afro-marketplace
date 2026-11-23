import { useCategories, useFeaturedProviders } from '@afro/common';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { HeroSearchForm } from '../components/HeroSearchForm';
import { HowItWorks } from '../components/HowItWorks';
import { ProviderCard } from '../components/ProviderCard';

/** P1 : l'accueil. Recherche « Quoi / Où / Quand », catégories, prestataires à la une, comment ça marche. */
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
  const mainCategories = categories.data?.filter((category) => !category.parentId) ?? [];

  return (
    <>
      {accountDeleted && (
        <p role="status" className="bg-muted px-4 py-3 text-center text-sm">
          Ton compte a bien été supprimé. Merci d’avoir utilisé Wenzee.
        </p>
      )}
      <section className="bg-linear-to-b from-muted to-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 md:py-24">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl font-display text-4xl leading-tight font-semibold md:text-5xl"
          >
            Les talents afro pour tous vos événements
          </motion.h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Traiteurs, danseurs, DJ, speakers, coiffeuses… Trouvez le bon prestataire en
            Île-de-France et demandez un devis en quelques minutes.
          </p>
          <HeroSearchForm />
          <ul className="flex flex-wrap gap-2" aria-label="Catégories">
            {mainCategories.map((category) => (
              <li key={category.id}>
                <Link
                  to={`/categories/${category.slug}`}
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <span aria-hidden>{category.icon}</span> {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

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
