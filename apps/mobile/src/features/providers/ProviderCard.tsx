import type { ProviderCard as ProviderCardData } from '@afro/common';
import { BadgeCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Card, Photo, Rating, Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { priceLabel } from './priceLabel';
import { profileHref } from './profileHref';
import { useThemeColors } from '@/theme/useTheme';

type ProviderCardProps = {
  provider: ProviderCardData;
  className?: string;
  /** Aperçu seulement (« Mon profil », lot M15b) : la carte ne s'ouvre pas. */
  preview?: boolean;
};

/**
 * La carte d'un prestataire (maquette : « À la une », résultats de recherche) :
 * photo, nom, note, ville et prix. Au toucher, elle ouvre le profil complet.
 */
export function ProviderCard({ provider, className, preview = false }: ProviderCardProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole={preview ? undefined : 'link'}
      disabled={preview}
      accessibilityLabel={`${provider.displayName}, ${provider.city}, ${priceLabel(provider.priceFrom)}`}
      onPress={() => router.push(profileHref(provider.slug))}
      className={cn('active:opacity-80', className)}
    >
      <Card className="overflow-hidden">
        <Photo uri={provider.coverUrl} className="h-[120px] w-full" />
        <View className="gap-1 p-3">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1 flex-row items-center gap-1">
              <Text weight="bold" numberOfLines={1} className="shrink">
                {provider.displayName}
              </Text>
              {provider.isProVerified ? (
                <BadgeCheck
                  size={16}
                  color={colors.success}
                  accessibilityLabel={t('common.verified')}
                />
              ) : null}
            </View>
            <Rating value={provider.ratingAverage} count={provider.ratingCount} />
          </View>
          <Text size="sm" tone="muted" numberOfLines={1}>
            {`${provider.city} · ${priceLabel(provider.priceFrom)}`}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
