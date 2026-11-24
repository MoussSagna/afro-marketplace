import type { ProviderCard } from '@afro/common';
import { BadgeCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Photo, Rating, Text } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';
import { priceLabel } from '../providers/priceLabel';

type SearchResultCardProps = {
  provider: ProviderCard;
  /** La catégorie à afficher sous le nom (« Nourriture »), déjà traduite. */
  categoryName?: string;
};

/**
 * Une grande carte de résultat (maquette section 8, façon Airbnb) : grande photo arrondie,
 * pastille « Vérifié », puis nom et note, catégorie et ville, et le prix « dès … ».
 * Le profil complet (lot M8) s'ouvrira au toucher.
 */
export function SearchResultCard({ provider, categoryName }: SearchResultCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const subtitle = [categoryName, provider.city].filter(Boolean).join(' · ');
  const price = priceLabel(provider.priceFrom);
  return (
    <View
      className="mt-5"
      accessible
      accessibilityLabel={[provider.displayName, subtitle, price].join(', ')}
    >
      <View>
        <Photo uri={provider.coverUrl} className="h-[290px] w-full rounded-[20px]" />
        {provider.isProVerified ? (
          <View
            className="absolute left-3.5 top-3.5 flex-row items-center gap-1 rounded-full px-3 py-1.5"
            style={{ backgroundColor: 'rgba(253, 247, 240, 0.95)' }}
          >
            <BadgeCheck size={14} color={colors.success} />
            <Text size="xs" weight="bold" style={{ color: '#2b1a12' }}>
              {t('common.verified')}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="mt-2.5 flex-row items-center justify-between gap-2">
        <Text weight="bold" numberOfLines={1} className="shrink">
          {provider.displayName}
        </Text>
        <Rating value={provider.ratingAverage} count={provider.ratingCount} />
      </View>
      {subtitle ? (
        <Text size="sm" tone="muted" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      <Text size="sm" weight="semibold" className="mt-1 underline">
        {price}
      </Text>
    </View>
  );
}
