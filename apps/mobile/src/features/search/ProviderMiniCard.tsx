import { useCategories, type ProviderCard } from '@afro/common';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Photo, Rating, Text } from '@/components/ui';
import { ratingLabel } from '@/components/ui/Rating';
import { useCategoryName } from '@/i18n/useCategoryName';
import { FavoriteButton } from '../favorites/FavoriteButton';
import { priceLabel } from '../providers/priceLabel';
import { profileHref } from '../providers/profileHref';
import { isCrowdFavorite, mainCategoryOf } from './providerLabels';

/**
 * Une petite carte des rangées horizontales (façon Airbnb) : photo carrée arrondie, étiquette
 * « Coup de cœur » ou « Vérifié », cœur des favoris, puis nom, catégorie · ville, note et prix « dès … ».
 * Au toucher, elle ouvre le profil (le cœur, lui, ne fait que changer le favori).
 */
export function ProviderMiniCard({ provider, width }: { provider: ProviderCard; width: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const categories = useCategories();
  const categoryName = useCategoryName();
  const category = mainCategoryOf(provider.categoryIds, categories.data);
  const subtitle = [category ? categoryName(category) : undefined, provider.city]
    .filter(Boolean)
    .join(' · ');
  const price = priceLabel(provider.priceFrom);
  const label = isCrowdFavorite(provider)
    ? t('home.crowdFavorite')
    : provider.isProVerified
      ? t('common.verified')
      : undefined;

  return (
    <View style={{ width }}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={[
          provider.displayName,
          subtitle,
          ratingLabel(provider.ratingAverage, provider.ratingCount),
          price,
          label,
        ]
          .filter(Boolean)
          .join(', ')}
        onPress={() => router.push(profileHref(provider.slug))}
        className="active:opacity-80"
      >
        <Photo uri={provider.coverUrl} className="aspect-square w-full rounded-2xl" />
        {label ? (
          <View
            className="absolute left-2 top-2 rounded-full px-2.5 py-1"
            style={{ backgroundColor: 'rgba(253, 247, 240, 0.95)' }}
          >
            <Text size="xs" weight="bold" style={{ color: '#2b1a12' }}>
              {label}
            </Text>
          </View>
        ) : null}
        <View className="mt-2 flex-row items-center justify-between gap-1">
          <Text size="sm" weight="bold" numberOfLines={1} className="shrink">
            {provider.displayName}
          </Text>
          <Rating value={provider.ratingAverage} count={provider.ratingCount} />
        </View>
        {subtitle ? (
          <Text size="xs" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <Text size="xs" weight="semibold" className="mt-0.5">
          {price}
        </Text>
      </Pressable>
      {/* À côté du lien (pas dedans) : VoiceOver / TalkBack l'atteignent comme un bouton à part. */}
      <FavoriteButton
        providerId={provider.id}
        providerName={provider.displayName}
        className="absolute right-2 top-2"
      />
    </View>
  );
}
