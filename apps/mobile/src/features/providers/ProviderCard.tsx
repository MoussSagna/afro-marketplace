import type { ProviderCard as ProviderCardData } from '@afro/common';
import { BadgeCheck } from 'lucide-react-native';
import { View } from 'react-native';
import { Card, Photo, Rating, Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { priceLabel } from './priceLabel';

type ProviderCardProps = {
  provider: ProviderCardData;
  className?: string;
};

/**
 * La carte d'un prestataire (maquette : « À la une », résultats de recherche) :
 * photo, nom, note, ville et prix. Le profil complet (lot M8) s'ouvrira au toucher.
 */
export function ProviderCard({ provider, className }: ProviderCardProps) {
  return (
    <Card
      className={cn('overflow-hidden', className)}
      accessible
      accessibilityLabel={`${provider.displayName}, ${provider.city}, ${priceLabel(provider.priceFrom)}`}
    >
      <Photo uri={provider.coverUrl} className="h-[120px] w-full" />
      <View className="gap-1 p-3">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-1">
            <Text weight="bold" numberOfLines={1} className="shrink">
              {provider.displayName}
            </Text>
            {provider.isProVerified ? (
              <BadgeCheck size={16} color="#2E6B3F" accessibilityLabel="Vérifié" />
            ) : null}
          </View>
          <Rating value={provider.ratingAverage} count={provider.ratingCount} />
        </View>
        <Text size="sm" tone="muted" numberOfLines={1}>
          {`${provider.city} · ${priceLabel(provider.priceFrom)}`}
        </Text>
      </View>
    </Card>
  );
}
