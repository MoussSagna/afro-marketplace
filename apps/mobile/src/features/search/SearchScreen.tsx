import { useCategories, useInfiniteProviderSearch } from '@afro/common';
import { useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import emptyImage from '../../../assets/images/aucun-resultat.webp';
import { WenzeeLoader } from '@/components/brand/WenzeeLoader';
import { QueryState } from '@/components/QueryState';
import { Button, EmptyState, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { CategoryBar } from './CategoryBar';
import { countPanelFilters } from './countPanelFilters';
import { FiltersSheet } from './FiltersSheet';
import { SearchHome } from './SearchHome';
import { SearchPill } from './SearchPill';
import { SearchResultCard } from './SearchResultCard';
import { isSearching } from './searchState';
import { SearchWizard } from './SearchWizard';
import { useSearchFilters } from './useSearchFilters';

/** Hauteur de la pilule (marge comprise) avant qu'elle soit mesurée. */
const PILL_SPACE = 70;

/**
 * L'onglet Recherche, premier onglet et écran d'ouverture de l'app (P2, maquette section 8, façon Airbnb).
 * La pilule du haut résume la recherche (elle s'ouvre en plein écran) et porte le bouton Filtres.
 * Deux états (voir searchState) :
 * - « home », sans recherche : la pilule posée sur le carrousel « À la une », puis les catégories ;
 * - « results », dès qu'une recherche est lancée : la rangée de catégories, puis les résultats en grandes
 *   cartes (la suite se charge en arrivant en bas).
 * On revient à « home » en effaçant la recherche, ou en touchant l'onglet Recherche quand on y est déjà.
 * Les filtres vivent dans l'adresse de l'écran (voir useSearchFilters).
 */
export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { filters, mode, update, replace, showAll, clearFilters, reset } = useSearchFilters();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pillHeight, setPillHeight] = useState(PILL_SPACE);

  // Toucher l'onglet Recherche quand on y est déjà : retour à l'état initial.
  useEffect(
    () =>
      navigation.addListener('tabPress' as never, () => {
        if (navigation.isFocused()) reset();
      }),
    [navigation, reset],
  );

  // La transition entre les deux états : un fondu avec un léger glissement vers le haut.
  const reduceMotion = useReduceMotion();
  const [appear] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduceMotion) return;
    appear.setValue(0);
    const animation = Animated.timing(appear, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [mode, appear, reduceMotion]);

  return (
    <View className="flex-1 bg-background">
      {/* Sur la photo du carrousel, l'heure et la batterie passent en clair. */}
      <StatusBar style={mode === 'home' ? 'light' : 'auto'} />
      <Animated.View
        key={mode}
        testID={mode === 'home' ? 'search-state-home' : 'search-state-results'}
        style={{
          flex: 1,
          opacity: appear,
          transform: [
            { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        }}
      >
        {mode === 'home' ? (
          <SearchHome
            onSelectCategory={(category) => update({ category: category.slug })}
            onSeeAll={showAll}
            onSeeSection={(sectionFilters) => replace(sectionFilters)}
          />
        ) : (
          <View className="flex-1" style={{ paddingTop: insets.top + pillHeight }}>
            <CategoryBar
              selected={filters.category}
              onSelect={(category) => update({ category })}
            />
            <Results onClearFilters={clearFilters} />
          </View>
        )}
      </Animated.View>

      {/* La même pilule dans les deux états : posée sur la photo, ou en haut des résultats. */}
      <View
        className="absolute inset-x-0"
        style={{ top: insets.top }}
        onLayout={(event) => setPillHeight(event.nativeEvent.layout.height)}
      >
        <SearchPill
          filters={filters}
          activeFilters={countPanelFilters(filters)}
          canClear={mode === 'results'}
          onOpen={() => setWizardOpen(true)}
          onClear={reset}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      </View>

      <SearchWizard
        visible={wizardOpen}
        filters={filters}
        onClose={() => setWizardOpen(false)}
        onSubmit={(draft) => {
          // Une recherche vide validée revient à l'état initial.
          replace(draft, { results: isSearching(draft) });
          setWizardOpen(false);
        }}
      />
      <FiltersSheet
        visible={filtersOpen}
        filters={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={(draft) => {
          update(draft);
          setFiltersOpen(false);
        }}
      />
    </View>
  );
}

/** Les résultats : nombre et tri, grandes cartes, page suivante en arrivant en bas. */
function Results({ onClearFilters }: { onClearFilters(): void }) {
  const { t } = useTranslation();
  const { filters } = useSearchFilters();
  const onScroll = useCollapseOnScroll();
  const search = useInfiniteProviderSearch(filters);
  const categories = useCategories();
  const categoryName = useCategoryName();

  const items = search.data?.pages.flatMap((page) => page.items) ?? [];
  const total = search.data?.pages[0]?.total ?? 0;
  // Le nom de la première catégorie du prestataire, pour la ligne sous son nom.
  const categoryOf = (ids: string[]) => {
    const category = categories.data?.find((c) => ids.includes(c.id));
    return category ? categoryName(category) : undefined;
  };

  return (
    <View className="flex-1">
      <QueryState
        isPending={search.isPending}
        isError={search.isError}
        onRetry={() => void search.refetch()}
        loadingLabel={t('search.loading')}
        placeholder={
          <View className="flex-1 items-center justify-center pb-24">
            <WenzeeLoader size={110} message={t('search.loading')} />
          </View>
        }
      >
        <FlatList
          data={items}
          keyExtractor={(provider) => provider.id}
          renderItem={({ item }) => (
            <SearchResultCard provider={item} categoryName={categoryOf(item.categoryIds)} />
          )}
          accessibilityLabel={t('search.resultsList')}
          testID="search-results"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerClassName="px-5"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
          ListHeaderComponent={
            items.length ? (
              <View className="mt-3.5 flex-row justify-between">
                <Text size="sm" tone="muted">
                  <Text size="sm" weight="bold">
                    {t('search.results', { count: total })}
                  </Text>
                  {filters.date ? ` ${t('search.freeThatDay')}` : ''}
                </Text>
                <Text size="sm" tone="muted">
                  {t(`search.sort.${filters.sort ?? 'relevance'}`)}
                </Text>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              image={emptyImage}
              title={t('search.emptyTitle')}
              description={t('search.emptyHint')}
              action={
                <Button variant="outline" size="md" onPress={onClearFilters}>
                  {t('search.clearFilters')}
                </Button>
              }
            />
          }
          onEndReached={() => {
            if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            search.isFetchingNextPage ? (
              <WenzeeLoader size={36} label={t('search.loadingMore')} className="py-6" />
            ) : undefined
          }
        />
      </QueryState>
    </View>
  );
}
