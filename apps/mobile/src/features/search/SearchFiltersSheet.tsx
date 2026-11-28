import {
  formatPrice,
  useCategories,
  useCulturalOrigins,
  useProviderSearch,
  type ProviderSearchFilters,
} from '@afro/common';
import {
  ArrowUpDown,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Globe,
  LayoutGrid,
  MapPin,
  Star,
  type LucideIcon,
} from 'lucide-react-native';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Switch, View } from 'react-native';
import { AppBottomSheet, type AppBottomSheetRef } from '@/components/AppBottomSheet';
import { Button, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { useLanguage } from '@/i18n/useLanguage';
import { eventDay } from '@/lib/dates';
import { useThemeColors } from '@/theme/useTheme';
import { draftChanges, draftFrom, type FiltersDraft } from './filterDraft';
import {
  BudgetView,
  CategoryView,
  DateView,
  OriginsView,
  RatingView,
  SortView,
  WhereView,
} from './FilterViews';

type SubView = 'category' | 'where' | 'date' | 'budget' | 'rating' | 'sort' | 'origins';

export type SearchFiltersSheetRef = {
  /** Ouvre le panneau, avec une copie des filtres en cours. */
  present(): void;
  dismiss(): void;
};

type SearchFiltersSheetProps = {
  /** Les filtres de la recherche en cours (l'adresse de l'écran : la source de vérité). */
  filters: ProviderSearchFilters;
  /** « Afficher les résultats » : les filtres du panneau, à appliquer à la recherche. */
  onApply(changes: Partial<ProviderSearchFilters>): void;
};

const SUB_TITLES = {
  category: 'search.sheet.category',
  where: 'search.sheet.where',
  date: 'search.sheet.date',
  budget: 'search.sheet.budget',
  rating: 'search.sheet.rating',
  sort: 'search.sheet.sort',
  origins: 'search.sheet.origins',
} as const satisfies Record<SubView, string>;

/**
 * Le panneau des filtres, façon Airbnb, sur le panneau réutilisable `AppBottomSheet`
 * (@gorhom/bottom-sheet : fond, poignée, glissement, en-tête, pied fixe).
 * - Liste des filtres (Catégorie, Lieu, Date, Budget, Note, Tri, Origines, Vérifiés), chacun avec sa
 *   valeur ; Catégorie, Lieu, Date, Budget… s'ouvrent DANS le panneau (pas de modale de plus).
 * - Un BROUILLON : rien n'est appliqué tant qu'on ne touche pas « Afficher … » ; fermer (croix,
 *   glisser vers le bas, fond) ne change rien.
 * - Pied fixe : le nombre de prestataires qui correspondent, en direct.
 */
export const SearchFiltersSheet = forwardRef<SearchFiltersSheetRef, SearchFiltersSheetProps>(
  function SearchFiltersSheet({ filters, onApply }, ref) {
    const { t } = useTranslation();
    const sheet = useRef<AppBottomSheetRef>(null);
    const [draft, setDraft] = useState<FiltersDraft>({});
    const [view, setView] = useState<SubView | 'list'>('list');
    const change = useCallback(
      (changes: FiltersDraft) => setDraft((d) => ({ ...d, ...changes })),
      [],
    );

    useImperativeHandle(
      ref,
      () => ({
        present() {
          setDraft(draftFrom(filters));
          setView('list');
          sheet.current?.present();
        },
        dismiss() {
          sheet.current?.dismiss();
        },
      }),
      [filters],
    );

    // Le nombre de résultats avec ces filtres, en direct (une page d'un seul résultat suffit).
    const count = useProviderSearch({ ...filters, ...draftChanges(draft), page: 1, pageSize: 1 });
    const total = count.data?.total;

    const apply = () => {
      onApply(draftChanges(draft));
      sheet.current?.dismiss();
    };

    const sub = view === 'list' ? undefined : view;
    return (
      <AppBottomSheet
        ref={sheet}
        title={sub ? t(SUB_TITLES[sub]) : t('search.sheet.title')}
        closeLabel={t('search.sheet.close')}
        backLabel={t('search.sheet.back')}
        onBack={sub ? () => setView('list') : undefined}
        onDismiss={() => setView('list')}
        testID="filters-sheet"
        headerRight={
          <Pressable
            accessibilityRole="button"
            onPress={() => setDraft({})}
            hitSlop={8}
            className="h-11 justify-center px-1"
          >
            <Text size="sm" weight="semibold" tone="primary">
              {t('search.sheet.reset')}
            </Text>
          </Pressable>
        }
        footer={
          sub ? (
            <Button variant="primary" fullWidth onPress={() => setView('list')}>
              {t('search.sheet.done')}
            </Button>
          ) : (
            <Button variant="primary" fullWidth onPress={apply} testID="filters-apply">
              {total === undefined
                ? t('search.sheet.showResults')
                : t('search.sheet.show', { count: total })}
            </Button>
          )
        }
      >
        {sub ? (
          <View className="px-5 pt-5">
            {sub === 'category' ? <CategoryView draft={draft} change={change} /> : null}
            {sub === 'where' ? <WhereView draft={draft} change={change} /> : null}
            {sub === 'date' ? <DateView draft={draft} change={change} /> : null}
            {sub === 'budget' ? <BudgetView draft={draft} change={change} /> : null}
            {sub === 'rating' ? <RatingView draft={draft} change={change} /> : null}
            {sub === 'sort' ? <SortView draft={draft} change={change} /> : null}
            {sub === 'origins' ? <OriginsView draft={draft} change={change} /> : null}
          </View>
        ) : (
          <FilterList draft={draft} change={change} open={setView} />
        )}
      </AppBottomSheet>
    );
  },
);

/** Une ligne de la liste : icône, nom du filtre, sa valeur, flèche (ouvre le sous-écran). */
function Row({
  icon: Icon,
  label,
  value,
  active,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  active: boolean;
  onPress(): void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      onPress={onPress}
      className="min-h-[68px] flex-row items-center gap-4 border-b border-border px-5 active:bg-muted"
    >
      <Icon size={24} color={active ? colors.primary : colors.foreground} strokeWidth={1.8} />
      <View className="flex-1">
        <Text weight="bold">{label}</Text>
        <Text
          size="sm"
          tone={active ? 'primary' : 'muted'}
          weight={active ? 'semibold' : 'regular'}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.foreground} />
    </Pressable>
  );
}

/** La liste des filtres, chacun avec sa valeur du brouillon. */
function FilterList({
  draft,
  change,
  open,
}: {
  draft: FiltersDraft;
  change(changes: FiltersDraft): void;
  open(view: SubView): void;
}) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const categoryName = useCategoryName();
  const categories = useCategories().data ?? [];
  const origins = useCulturalOrigins().data ?? [];
  const category = categories.find((c) => c.slug === draft.category);
  const format = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const originNames = (draft.origins ?? [])
    .map((slug) => origins.find((o) => o.slug === slug)?.name ?? slug)
    .join(', ');

  return (
    <View>
      <Row
        icon={LayoutGrid}
        label={t('search.sheet.category')}
        value={category ? categoryName(category) : t('search.sheet.categoryAll')}
        active={!!category}
        onPress={() => open('category')}
      />
      <Row
        icon={MapPin}
        label={t('search.sheet.where')}
        value={draft.city ?? t('search.sheet.anywhere')}
        active={!!draft.city}
        onPress={() => open('where')}
      />
      <Row
        icon={CalendarDays}
        label={t('search.sheet.date')}
        value={draft.date ? eventDay(draft.date, locale) : t('search.sheet.dateAny')}
        active={!!draft.date}
        onPress={() => open('date')}
      />
      <Row
        icon={CircleDollarSign}
        label={t('search.sheet.budget')}
        value={
          draft.budgetMax === undefined
            ? t('search.sheet.budgetAny')
            : t('search.sheet.budgetUpTo', { price: formatPrice(draft.budgetMax, locale) })
        }
        active={draft.budgetMax !== undefined}
        onPress={() => open('budget')}
      />
      <Row
        icon={Star}
        label={t('search.sheet.rating')}
        value={
          draft.minRating === undefined
            ? t('search.sheet.ratingAny')
            : draft.minRating === 5
              ? t('search.sheet.ratingFive')
              : t('search.sheet.ratingAtLeast', { value: format(draft.minRating) })
        }
        active={draft.minRating !== undefined}
        onPress={() => open('rating')}
      />
      <Row
        icon={ArrowUpDown}
        label={t('search.sheet.sort')}
        value={t(`search.sort.${draft.sort ?? 'relevance'}`)}
        active={!!draft.sort && draft.sort !== 'relevance'}
        onPress={() => open('sort')}
      />
      <Row
        icon={Globe}
        label={t('search.sheet.origins')}
        value={originNames || t('search.sheet.originsAny')}
        active={!!originNames}
        onPress={() => open('origins')}
      />
      <View className="min-h-[76px] flex-row items-center gap-4 px-5 py-3">
        <BadgeCheck
          size={24}
          color={draft.verifiedOnly ? colors.primary : colors.foreground}
          strokeWidth={1.8}
        />
        <View className="flex-1">
          <Text weight="bold">{t('search.sheet.verified')}</Text>
          <Text size="sm" tone="muted">
            {t('search.sheet.verifiedHint')}
          </Text>
        </View>
        <Switch
          accessibilityLabel={t('search.sheet.verified')}
          value={draft.verifiedOnly ?? false}
          onValueChange={(on) => change({ verifiedOnly: on || undefined })}
          trackColor={{ true: colors.cta, false: colors.input }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}
