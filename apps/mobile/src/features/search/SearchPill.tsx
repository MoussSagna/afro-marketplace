import type { ProviderSearchFilters } from '@afro/common';
import { ChevronLeft, Search, SlidersHorizontal } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';
import { useSearchSummary } from './useSearchSummary';

type SearchPillProps = {
  filters: ProviderSearchFilters;
  /** Le nombre de filtres actifs du panneau Filtres (pastille sur le bouton). */
  activeFilters: number;
  /** Montrer le bouton qui efface la recherche (par défaut : dès qu'un critère est choisi). */
  canClear?: boolean;
  /** Montrer le bouton Filtres : seulement pendant une recherche (pas en découverte). Par défaut : oui. */
  showFilters?: boolean;
  onOpen(): void;
  onClear(): void;
  onOpenFilters(): void;
};

/**
 * La pilule en haut de l'onglet Recherche (maquette section 8) : elle résume la recherche,
 * s'ouvre en plein écran au toucher, et porte le bouton des filtres (avec le nombre de filtres actifs).
 * Une fois une recherche faite, la flèche à gauche efface tout et revient à l'état initial de l'onglet.
 */
export function SearchPill({
  filters,
  activeFilters,
  canClear,
  showFilters = true,
  onOpen,
  onClear,
  onOpenFilters,
}: SearchPillProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const summary = useSearchSummary(filters);
  return (
    <View
      className="mx-4 mt-1.5 min-h-[62px] flex-row items-center gap-3 rounded-full border border-border bg-card py-2 pl-4 pr-2"
      style={{ boxShadow: '0 6px 20px rgba(43, 26, 18, 0.14)' }}
    >
      {(canClear ?? summary.hasSearch) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('search.clearSearch')}
          onPress={onClear}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
        >
          <ChevronLeft size={22} color={colors.foreground} />
        </Pressable>
      ) : (
        <Search size={20} color={colors.foreground} />
      )}
      <Pressable
        accessibilityRole="search"
        accessibilityLabel={`${summary.title}, ${summary.hint}`}
        accessibilityHint={t('search.openSearch')}
        onPress={onOpen}
        className="flex-1 active:opacity-70"
      >
        <Text size="sm" weight="bold" numberOfLines={1}>
          {summary.title}
        </Text>
        <Text size="xs" tone="muted" numberOfLines={1}>
          {summary.hint}
        </Text>
      </Pressable>
      {showFilters ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            activeFilters > 0
              ? t('search.filtersActive', { count: activeFilters })
              : t('search.filters')
          }
          onPress={onOpenFilters}
          className="h-11 w-11 items-center justify-center rounded-full border border-input bg-card active:opacity-70"
        >
          <SlidersHorizontal size={18} color={colors.foreground} />
          {activeFilters > 0 ? (
            <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1">
              <Text size="caption" weight="bold" tone="inverse">
                {String(activeFilters)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}
