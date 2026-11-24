import { useCategories, useInfiniteProviderSearch } from '@afro/common';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import emptyImage from '../../../assets/images/aucun-resultat.webp';
import { WenzeeLoader } from '@/components/brand/WenzeeLoader';
import { QueryState } from '@/components/QueryState';
import { Button, EmptyState, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { CategoryBar } from './CategoryBar';
import { countPanelFilters } from './countPanelFilters';
import { FiltersSheet } from './FiltersSheet';
import { SearchPill } from './SearchPill';
import { SearchResultCard } from './SearchResultCard';
import { SearchWizard } from './SearchWizard';
import { useSearchFilters } from './useSearchFilters';

/**
 * L'onglet Recherche (P2, maquette section 8, façon Airbnb).
 * - En haut : la pilule qui résume la recherche (elle s'ouvre en plein écran) et le bouton Filtres.
 * - Dessous : la rangée de catégories.
 * - Puis les résultats en grandes cartes ; la suite se charge quand on arrive en bas.
 * Les filtres vivent dans l'adresse de l'écran (voir useSearchFilters).
 */
export function SearchScreen() {
  const { t } = useTranslation();
  const { filters, update, reset } = useSearchFilters();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <SearchPill
        filters={filters}
        activeFilters={countPanelFilters(filters)}
        onOpen={() => setWizardOpen(true)}
        onClear={reset}
        onOpenFilters={() => setFiltersOpen(true)}
      />
      <CategoryBar selected={filters.category} onSelect={(category) => update({ category })} />

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
                  <Button variant="outline" size="md" onPress={reset}>
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

      <SearchWizard
        visible={wizardOpen}
        filters={filters}
        onClose={() => setWizardOpen(false)}
        onSubmit={(draft) => {
          update(draft);
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
    </SafeAreaView>
  );
}
