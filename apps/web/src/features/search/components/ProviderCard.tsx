import { formatPrice, type ProviderCard as ProviderCardData } from '@afro/common';
import { BadgeCheck, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { Rating } from '@/components/Rating';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProviderCardProps {
  provider: ProviderCardData;
  categoryName?: string;
}

/**
 * La carte d'un prestataire dans les listes (accueil, résultats).
 * Toute la carte est cliquable : le lien est sur le titre, et une astuce CSS
 * (after:absolute inset-0) étend sa zone de clic à toute la carte, sans
 * imbriquer d'éléments interactifs.
 */
export function ProviderCard({ provider, categoryName }: ProviderCardProps) {
  return (
    <Card className="relative h-full gap-3 overflow-hidden pt-0 pb-5 transition-shadow focus-within:ring-[3px] focus-within:ring-ring/50 hover:shadow-md">
      <div className="relative h-40 bg-linear-to-br from-brand-400 via-brand-600 to-gold-500">
        {provider.coverUrl ? (
          <img src={provider.coverUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span
            aria-hidden
            className="absolute bottom-3 left-4 font-display text-4xl font-semibold text-white/90"
          >
            {provider.displayName.charAt(0)}
          </span>
        )}
      </div>

      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          {categoryName && <Badge variant="secondary">{categoryName}</Badge>}
          {provider.isProVerified && (
            <Badge variant="outline" className="text-forest-700">
              <BadgeCheck aria-hidden />
              Pro vérifié
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">
          <h3>
            <Link
              to={`/prestataires/${provider.slug}`}
              className="outline-none after:absolute after:inset-0"
            >
              {provider.displayName}
            </Link>
          </h3>
        </CardTitle>
      </CardHeader>

      <CardContent className="mt-auto flex flex-col gap-2 text-sm">
        <p className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="size-4" aria-hidden />
          {provider.city}
        </p>
        <div className="flex items-center justify-between gap-2">
          <Rating value={provider.ratingAverage} count={provider.ratingCount} />
          <p className="font-medium">
            {provider.priceFrom === undefined
              ? 'Sur devis'
              : `Dès ${formatPrice(provider.priceFrom)}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
