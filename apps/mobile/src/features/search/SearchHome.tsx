import {
  formatPrice,
  useCategories,
  useFeaturedProviders,
  type Category,
  type ProviderSearchFilters,
} from '@afro/common';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { QueryState } from '@/components/QueryState';
import { Accent, Button, Heading, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { mainCategories } from '@/lib/categories';
import { shortDay, todayIso } from '@/lib/dates';
import { useLanguage } from '@/i18n/useLanguage';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { CATEGORY_ICONS } from './categoryIcons';
import { CAROUSEL_HEIGHT, FeaturedCarousel } from './FeaturedCarousel';
import { homeSections, SMALL_BUDGET } from './homeSections';
import { HowItWorks } from './HowItWorks';
import { ProviderRow } from './ProviderRow';
import { useThemeColors } from '@/theme/useTheme';

/** Un titre de section avec son lien « Tout voir ». */
function SectionTitle({
  title,
  accent,
  onSeeAll,
}: {
  title: string;
  accent: string;
  onSeeAll: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-baseline justify-between px-5">
      <Heading level={2}>
        {title} <Accent>{accent}</Accent>
      </Heading>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={t('common.seeAllOf', { section: `${title} ${accent}` })}
        hitSlop={10}
        onPress={onSeeAll}
      >
        <Text size="sm" weight="semibold" tone="primary">
          {t('common.seeAll')}
        </Text>
      </Pressable>
    </View>
  );
}

/** Une catégorie principale : son icône sur fond sable et son nom. */
function CategoryTile({ category, onPress }: { category: Category; onPress: () => void }) {
  const icon = CATEGORY_ICONS[category.slug];
  const colors = useThemeColors();
  const name = useCategoryName()(category);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      className="flex-1 items-center gap-1.5 active:opacity-70"
    >
      <View className="aspect-square w-full items-center justify-center rounded-2xl bg-secondary">
        {icon ? (
          <SvgXml xml={icon} width={38} height={38} color={colors.primary} />
        ) : (
          <Text className="text-h3">{category.icon ?? '•'}</Text>
        )}
      </View>
      <Text size="xs" weight="medium" numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}

/**
 * L'accueil de la recherche (état initial de l'onglet Recherche ; ancien Accueil, maquette P1, lot M6) :
 * « À la une » en grand carrousel (sous la pilule de recherche de SearchScreen), puis les catégories principales.
 * Toucher une catégorie ou « Tout voir » passe aux résultats (filtrés sur la catégorie).
 * Ensuite, des rangées horizontales façon Airbnb (libres samedi, traiteurs, à Paris, musique, petits budgets) :
 * chacune est une recherche, et son titre ouvre les résultats avec ses filtres (`onSeeSection`).
 * En bas, « Comment ça marche » rappelle le principe des devis.
 */
export function SearchHome({
  onSelectCategory,
  onSeeAll,
  onSeeSection,
}: {
  onSelectCategory(category: Category): void;
  onSeeAll(): void;
  onSeeSection(filters: ProviderSearchFilters): void;
}) {
  const { t } = useTranslation();
  const onScroll = useCollapseOnScroll();
  const categories = useCategories();
  const featured = useFeaturedProviders();
  const insets = useSafeAreaInsets();
  const goSearch = (category?: Category) => (category ? onSelectCategory(category) : onSeeAll());
  const { locale } = useLanguage();
  // Calculées une fois par ouverture de l'écran : le samedi ne change pas pendant qu'on fait défiler.
  const sections = useMemo(() => homeSections(todayIso()), []);
  const subtitles: Record<(typeof sections)[number]['id'], string> = {
    saturday: t('home.sections.saturdayHint', {
      date: shortDay(sections[0]!.filters.date!, locale),
    }),
    food: t('home.sections.foodHint'),
    paris: t('home.sections.parisHint'),
    music: t('home.sections.musicHint'),
    smallBudget: t('home.sections.smallBudgetHint', {
      price: formatPrice(SMALL_BUDGET, locale),
    }),
  };

  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
      testID="search-home"
    >
      {/* « À la une » : une photo plein écran par prestataire, sous la pilule de recherche. */}
      {/* Même hauteur pendant le chargement et en cas d'erreur : la pilule, posée dessus, ne cache rien. */}
      <View
        style={{ minHeight: insets.top + CAROUSEL_HEIGHT }}
        className={featured.isSuccess ? undefined : 'justify-center bg-secondary pt-20'}
      >
        <QueryState
          isPending={featured.isPending}
          isError={featured.isError}
          onRetry={() => void featured.refetch()}
          loadingLabel={t('home.loadingFeatured')}
        >
          <FeaturedCarousel providers={featured.data ?? []} />
        </QueryState>
      </View>

      {/* Les catégories principales. */}
      <View className="mt-6 gap-3.5">
        <SectionTitle
          title={t('home.categoriesStart')}
          accent={t('home.categoriesAccent')}
          onSeeAll={() => goSearch()}
        />
        <View className="px-5">
          <QueryState
            isPending={categories.isPending}
            isError={categories.isError}
            onRetry={() => void categories.refetch()}
            loadingLabel={t('home.loadingCategories')}
          >
            <View className="flex-row gap-2.5">
              {mainCategories(categories.data ?? []).map((category) => (
                <CategoryTile
                  key={category.id}
                  category={category}
                  onPress={() => goSearch(category)}
                />
              ))}
            </View>
          </QueryState>
        </View>
      </View>

      {/* Les rangées horizontales, façon Airbnb. */}
      {sections.map((section) => (
        <ProviderRow
          key={section.id}
          testID={`home-row-${section.id}`}
          title={t(`home.sections.${section.id}`)}
          subtitle={subtitles[section.id]}
          filters={section.filters}
          onSeeAll={onSeeSection}
        />
      ))}

      <HowItWorks />

      {/* Pendant le développement seulement : l'écran de travail des composants. */}
      {__DEV__ ? (
        <View className="mt-4 px-5">
          <Link href="/catalogue" asChild>
            <Button variant="ghost" size="sm">
              {t('home.devComponents')}
            </Button>
          </Link>
        </View>
      ) : null}
    </ScrollView>
  );
}
