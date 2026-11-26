import { formatPrice, type ProviderCard as ProviderCardData } from '@afro/common';
import { BadgeCheck, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Rating } from '@/components/Rating';

interface FeaturedProviderCardProps {
  provider: ProviderCardData;
  categoryName?: string;
}

/**
 * Carte « à la une » de l'accueil : grande photo (zoom au survol), catégorie en pastille sur la photo,
 * badge « Pro vérifié », nom en Playfair, ville, note et prix.
 * Même astuce que `ProviderCard` : le lien est sur le nom et s'étend à toute la carte (after:inset-0).
 */
export function FeaturedProviderCard({ provider, categoryName }: FeaturedProviderCardProps) {
  // Si la photo ne se charge pas, on retombe sur le dégradé avec l'initiale (pas d'image cassée).
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = provider.coverUrl !== undefined && !coverFailed;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border/60 transition-transform duration-300 focus-within:ring-[3px] focus-within:ring-ring/50 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-linear-to-br from-ochre via-primary to-foreground">
        {showCover ? (
          <img
            src={provider.coverUrl}
            alt=""
            loading="lazy"
            onError={() => setCoverFailed(true)}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center font-display text-6xl font-bold text-white/90"
          >
            {provider.displayName.charAt(0)}
          </span>
        )}
        {provider.isProVerified && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold text-success">
            <BadgeCheck className="size-3.5" aria-hidden />
            Pro vérifié
          </span>
        )}
        {categoryName && (
          <span className="absolute bottom-3 left-3 rounded-full bg-accent px-3 py-1 text-xs font-bold tracking-[0.04em] text-accent-foreground uppercase">
            {categoryName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl leading-tight font-bold">
          <Link
            to={`/prestataires/${provider.slug}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {provider.displayName}
          </Link>
        </h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden />
          {provider.city}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-sm">
          <Rating value={provider.ratingAverage} count={provider.ratingCount} />
          <p className="font-semibold text-primary">
            {provider.priceFrom === undefined
              ? 'Sur devis'
              : `Dès ${formatPrice(provider.priceFrom)}`}
          </p>
        </div>
      </div>
    </article>
  );
}
