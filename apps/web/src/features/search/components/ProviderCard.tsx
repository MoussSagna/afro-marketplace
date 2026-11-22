import { formatPrice, type ProviderCard as ProviderCardData } from '@afro/common';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProviderCardProps {
  provider: ProviderCardData;
  categoryName?: string;
}

const ratingFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export function ProviderCard({ provider, categoryName }: ProviderCardProps) {
  return (
    <Card className="h-full gap-3 overflow-hidden pt-0 pb-5 transition-shadow hover:shadow-md">
      {/* En attendant les vraies photos (lot 3), un dégradé aux couleurs de la marque. */}
      <div
        aria-hidden
        className="flex h-36 items-end bg-linear-to-br from-brand-400 via-brand-600 to-gold-500 p-4"
      >
        <span className="font-display text-4xl font-semibold text-white/90">
          {provider.displayName.charAt(0)}
        </span>
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
          <h3>{provider.displayName}</h3>
        </CardTitle>
      </CardHeader>

      <CardContent className="mt-auto flex flex-col gap-2 text-sm">
        <p className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="size-4" aria-hidden />
          {provider.city}
        </p>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1">
            <Star className="size-4 fill-gold-400 text-gold-500" aria-hidden />
            <span className="font-medium">{ratingFormatter.format(provider.ratingAverage)}</span>
            <span className="text-muted-foreground">({provider.ratingCount} avis)</span>
          </p>
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
