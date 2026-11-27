import { useCategories, useCulturalOrigins, type ProviderCard } from '@afro/common';
import { useRouter } from 'expo-router';
import { Award, BadgeCheck, Globe, MapPin, Star, Tag, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ratingLabel } from '@/components/ui/Rating';
import { Heading, Photo, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { formatRating } from '@/lib/cn';
import { priceLabel } from '../providers/priceLabel';
import { profileHref } from '../providers/profileHref';
import { mainCategoryOf } from './providerLabels';

/** Hauteur du carrousel sous la barre d'état (la pilule de recherche est posée dessus). */
export const CAROUSEL_HEIGHT = 440;
const SUN = '#F3B618';
const CREAM = '#FDF7F0';
const INK = '#2B1A12';
const TERRE = '#7A1F0E';

/** Une info de la ligne du bas : icône + texte, en blanc. */
function Info({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <View className="shrink flex-row items-center gap-1.5">
      <Icon size={16} color="#fff" strokeWidth={1.8} />
      <Text size="xs" weight="medium" numberOfLines={1} className="shrink text-white">
        {label}
      </Text>
    </View>
  );
}

function Slide({ provider, width, top }: { provider: ProviderCard; width: number; top: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const categories = useCategories();
  const origins = useCulturalOrigins();
  const categoryName = useCategoryName();
  const category = mainCategoryOf(provider.categoryIds, categories.data);
  const origin = origins.data?.find((o) => provider.culturalOriginIds.includes(o.id));
  const subtitle = [category ? categoryName(category) : undefined, provider.city]
    .filter(Boolean)
    .join(' · ');
  const price = priceLabel(provider.priceFrom);
  const infos = [
    category ? { icon: Tag, label: categoryName(category) } : undefined,
    origin ? { icon: Globe, label: origin.name } : undefined,
    { icon: MapPin, label: provider.city },
  ].filter((info): info is { icon: LucideIcon; label: string } => Boolean(info));

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={[
        provider.displayName,
        subtitle,
        provider.ratingCount > 0 ? ratingLabel(provider.ratingAverage, provider.ratingCount) : '',
        price,
        t('home.featuredBadge'),
      ]
        .filter(Boolean)
        .join(', ')}
      onPress={() => router.push(profileHref(provider.slug))}
      style={{ width, height: top + CAROUSEL_HEIGHT }}
      className="active:opacity-95"
    >
      <Photo
        uri={provider.coverUrl}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Voile sombre : le texte blanc reste lisible sur toutes les photos. */}
      <View
        className="absolute inset-0"
        style={{
          experimental_backgroundImage:
            'linear-gradient(180deg, rgba(43,26,18,0.45) 0%, rgba(43,26,18,0.05) 35%, rgba(43,26,18,0.85) 100%)',
          backgroundColor: 'rgba(43,26,18,0.25)',
        }}
      />

      {provider.isProVerified ? (
        <View
          className="absolute left-4 flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ top: top + 86, backgroundColor: CREAM }}
        >
          <BadgeCheck size={16} color="#fff" fill="#2E7D4F" />
          <Text size="sm" weight="bold" style={{ color: INK }}>
            {t('common.verified')}
          </Text>
        </View>
      ) : null}

      <View className="absolute inset-x-0 bottom-9 gap-1 px-5">
        <View className="flex-row items-center gap-1.5">
          <Award size={20} color={SUN} strokeWidth={1.8} />
          <Text weight="semibold" className="font-display text-base" style={{ color: '#F5D9A8' }}>
            {t('home.featuredBadge')}
          </Text>
        </View>
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Heading numberOfLines={1} className="text-[30px] leading-[36px] text-white">
              {provider.displayName}
            </Heading>
            {subtitle ? (
              <Text numberOfLines={1} className="text-white opacity-90">
                {subtitle}
              </Text>
            ) : null}
            {provider.ratingCount > 0 ? (
              <View className="mt-1 flex-row items-center gap-1.5">
                <Star size={20} color={SUN} fill={SUN} />
                <Text className="text-white">
                  {`${formatRating(provider.ratingAverage)} (${t('home.reviews', { count: provider.ratingCount })})`}
                </Text>
              </View>
            ) : (
              <Text size="sm" className="mt-1 text-white">
                {t('common.newProvider')}
              </Text>
            )}
          </View>
          <View className="mb-1 rounded-full px-4 py-2" style={{ backgroundColor: CREAM }}>
            <Text size="sm" weight="bold" style={{ color: TERRE }}>
              {price}
            </Text>
          </View>
        </View>
        <View
          className="mt-3 flex-row items-center gap-3 border-t pt-3"
          style={{ borderColor: 'rgba(255,255,255,0.25)' }}
        >
          {infos.map((info, index) => (
            <View key={info.label} className="shrink flex-row items-center gap-3">
              {index > 0 ? (
                <View className="h-4 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }} />
              ) : null}
              <Info icon={info.icon} label={info.label} />
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * « À la une » en haut de l'onglet Recherche (maquette fournie par Mouss le 27/11/2026) :
 * une photo plein écran par prestataire, qui défile de côté page par page (FlatList),
 * avec des points pour savoir où l'on en est. La pilule de recherche est posée par-dessus (SearchScreen).
 */
export function FeaturedCarousel({ providers }: { providers: ProviderCard[] }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View>
      <FlatList
        horizontal
        pagingEnabled
        data={providers}
        keyExtractor={(provider) => provider.id}
        renderItem={({ item }) => <Slide provider={item} width={width} top={insets.top} />}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        accessibilityLabel={t('home.featuredList')}
        testID="featured-list"
      />
      {providers.length > 1 ? (
        <View
          className="absolute inset-x-0 bottom-3 flex-row justify-center gap-2"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          testID="featured-dots"
        >
          {providers.map((provider, i) => (
            <View
              key={provider.id}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.45)' }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
