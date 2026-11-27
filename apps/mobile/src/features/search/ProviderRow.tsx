import { useProviderSearch, type ProviderSearchFilters } from '@afro/common';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { Heading, Text } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';
import { HOME_SECTION_SIZE } from './homeSections';
import { ProviderMiniCard } from './ProviderMiniCard';

const GUTTER = 20;
const GAP = 12;

/**
 * Une rangée horizontale de l'état initial (façon Airbnb) : un titre qui ouvre la recherche complète
 * (« Tout voir »), une phrase d'accroche, puis les cartes qui défilent de côté (on en voit deux et un bout
 * de la troisième, pour donner envie de glisser).
 * La rangée ne s'affiche que si sa recherche trouve quelqu'un : pas de titre au-dessus d'un vide.
 */
export function ProviderRow({
  testID,
  title,
  subtitle,
  filters,
  onSeeAll,
}: {
  testID: string;
  title: string;
  subtitle: string;
  filters: ProviderSearchFilters;
  onSeeAll(filters: ProviderSearchFilters): void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const search = useProviderSearch({ ...filters, pageSize: HOME_SECTION_SIZE });
  const items = search.data?.items ?? [];
  const cardWidth = Math.round((width - GUTTER - GAP * 2) / 2.3);

  if (search.isPending) {
    // Une place réservée (titre et deux cartes vides) : la page ne saute pas à l'arrivée des cartes.
    return (
      <View className="mt-8 gap-3 px-5" testID={`${testID}-loading`}>
        <View className="h-6 w-40 rounded-md bg-secondary" />
        <View className="flex-row gap-3">
          <View className="aspect-square rounded-2xl bg-secondary" style={{ width: cardWidth }} />
          <View className="aspect-square rounded-2xl bg-secondary" style={{ width: cardWidth }} />
        </View>
      </View>
    );
  }
  // Une rangée en erreur ou sans résultat disparaît : c'est du contenu en plus, la recherche reste là.
  if (search.isError || items.length === 0) return null;

  return (
    <View className="mt-8" testID={testID}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={t('common.seeAllOf', { section: title })}
        onPress={() => onSeeAll(filters)}
        className="flex-row items-center gap-1 px-5 active:opacity-70"
      >
        <View className="shrink">
          <Heading level={3}>{title}</Heading>
          <Text size="sm" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.foreground} strokeWidth={2.2} />
      </Pressable>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(provider) => provider.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: GAP }}
        className="mt-3"
        renderItem={({ item }) => <ProviderMiniCard provider={item} width={cardWidth} />}
      />
    </View>
  );
}
