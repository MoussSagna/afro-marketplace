import { useCategories, useFeaturedProviders } from '@afro/common';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProviderCard } from '../components/ProviderCard';

export function HomePage() {
  const providers = useFeaturedProviders();
  const categories = useCategories();

  const categoryName = (id: string | undefined) =>
    categories.data?.find((category) => category.id === id)?.name;
  const mainCategories = categories.data?.filter((category) => !category.parentId) ?? [];

  return (
    <>
      <section className="bg-linear-to-b from-brand-50 to-background">
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
          <ul className="flex flex-wrap gap-2" aria-label="Catégories">
            {mainCategories.map((category) => (
              <li key={category.id}>
                <Badge variant="outline" className="bg-background px-3 py-1 text-sm">
                  <span aria-hidden>{category.icon}</span> {category.name}
                </Badge>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Chargement">
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
    </>
  );
}
