import {
  useCategories,
  useCulturalOrigins,
  useProviderSearch,
  type ProviderSort,
} from '@afro/common';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Check, MapPin, Search, Star } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Calendar } from '@/components/Calendar';
import { Chip, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { useLanguage } from '@/i18n/useLanguage';
import { formatPrice } from '@afro/common';
import { mainCategories } from '@/lib/categories';
import { cn } from '@/lib/cn';
import { todayIso } from '@/lib/dates';
import { useThemeColors } from '@/theme/useTheme';
import { BudgetSlider } from './BudgetSlider';
import { CATEGORY_ICONS } from './categoryIcons';
import { BUDGET_SUGGESTIONS, RATING_OPTIONS, weekendDates, type FiltersDraft } from './filterDraft';
import { useCityCounts } from './useCityCounts';

type ViewProps = { draft: FiltersDraft; change(changes: FiltersDraft): void };

/** Le titre d'un sous-écran et sa phrase d'aide. */
function Intro({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="gap-1 pb-4">
      <Text weight="bold" className="text-[17px]">
        {title}
      </Text>
      {hint ? (
        <Text size="sm" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Une ligne à cocher (une seule réponse) : texte, coche à droite quand elle est choisie. */
function Choice({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
  icon?: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'min-h-[52px] flex-row items-center gap-3 rounded-2xl border px-4',
        selected ? 'border-[1.5px] border-cta bg-secondary' : 'border-border bg-card',
      )}
    >
      {icon}
      <Text weight={selected ? 'bold' : 'medium'} className="flex-1">
        {label}
      </Text>
      {selected ? <Check size={18} color={colors.primary} strokeWidth={2.6} /> : null}
    </Pressable>
  );
}

/**
 * Catégorie : les catégories principales réelles de la marketplace, en grille. Le moteur ne
 * cherche qu'UNE catégorie : toucher la catégorie choisie la retire (« Toutes »).
 */
export function CategoryView({ draft, change }: ViewProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const categoryName = useCategoryName();
  const categories = mainCategories(useCategories().data ?? []);
  return (
    <View>
      <Intro title={t('search.sheet.category')} hint={t('search.sheet.categoryHint')} />
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap justify-between gap-y-2.5">
        {categories.map((category) => {
          const selected = draft.category === category.slug;
          const icon = CATEGORY_ICONS[category.slug];
          return (
            <Pressable
              key={category.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={categoryName(category)}
              onPress={() => change({ category: selected ? undefined : category.slug })}
              className={cn(
                'h-[84px] w-[48.5%] justify-between rounded-2xl border p-3',
                selected ? 'border-[1.5px] border-cta bg-secondary' : 'border-border bg-card',
              )}
            >
              {icon ? (
                <SvgXml
                  xml={icon}
                  width={26}
                  height={26}
                  color={selected ? colors.primary : colors.foreground}
                />
              ) : null}
              <Text size="sm" weight={selected ? 'bold' : 'semibold'} numberOfLines={2}>
                {categoryName(category)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Lieu : un champ de ville, et les vraies villes des prestataires (avec leur nombre). */
export function WhereView({ draft, change }: ViewProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const cities = useCityCounts(draft.city);
  return (
    <View>
      <Intro title={t('search.sheet.whereTitle')} hint={t('search.sheet.whereHint')} />
      <View className="min-h-[50px] flex-row items-center gap-2.5 rounded-2xl border border-input bg-card px-4">
        <Search size={18} color={colors['muted-foreground']} />
        <BottomSheetTextInput
          accessibilityLabel={t('search.sheet.whereTitle')}
          placeholder={t('search.sheet.wherePlaceholder')}
          placeholderTextColor={colors['muted-foreground']}
          value={draft.city ?? ''}
          onChangeText={(city) => change({ city: city || undefined })}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          style={{ flex: 1, fontSize: 16, color: colors.foreground, paddingVertical: 12 }}
        />
      </View>
      <View className="mt-3 gap-1">
        {cities.map(([city, count]) => {
          const selected = draft.city === city;
          return (
            <Pressable
              key={city}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${city}, ${t('search.results', { count })}`}
              onPress={() => change({ city: selected ? undefined : city })}
              className="flex-row items-center gap-3 rounded-xl py-1.5 active:opacity-70"
            >
              <View
                className={cn(
                  'h-11 w-11 items-center justify-center rounded-xl',
                  selected ? 'bg-cta' : 'bg-secondary',
                )}
              >
                <MapPin size={20} color={selected ? colors['cta-foreground'] : colors.primary} />
              </View>
              <View className="flex-1">
                <Text size="sm" weight="semibold">
                  {city}
                </Text>
                <Text size="xs" tone="muted">
                  {t('search.results', { count })}
                </Text>
              </View>
              {selected ? <Check size={18} color={colors.primary} strokeWidth={2.6} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Date : le calendrier de l'app, et deux raccourcis (le samedi de ce week-end, du suivant). */
export function DateView({ draft, change }: ViewProps) {
  const { t } = useTranslation();
  const { thisWeekend, nextWeekend } = weekendDates();
  const shortcuts = [
    { label: t('search.sheet.thisWeekend'), date: thisWeekend },
    { label: t('search.sheet.nextWeekend'), date: nextWeekend },
  ];
  return (
    <View>
      <Intro title={t('search.sheet.dateTitle')} hint={t('search.sheet.dateHint')} />
      <View className="rounded-3xl border border-border bg-card px-2 py-3">
        <Calendar value={draft.date} onChange={(date) => change({ date })} firstDay={todayIso()} />
      </View>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {shortcuts.map((shortcut) => (
          <Chip
            key={shortcut.date}
            selected={draft.date === shortcut.date}
            onPress={() => change({ date: shortcut.date })}
          >
            {shortcut.label}
          </Chip>
        ))}
        <Chip selected={!draft.date} onPress={() => change({ date: undefined })}>
          {t('search.sheet.noDate')}
        </Chip>
      </View>
    </View>
  );
}

/** Budget : l'histogramme et son curseur (budget maximum), et des maximums tout prêts. */
export function BudgetView({ draft, change }: ViewProps) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  // Les prix de tous les prestataires, pour l'histogramme.
  const all = useProviderSearch({ pageSize: 50 });
  const prices = (all.data?.items ?? []).flatMap((p) =>
    p.priceFrom === undefined ? [] : [p.priceFrom],
  );
  return (
    <View>
      <Intro title={t('search.sheet.budgetTitle')} hint={t('search.sheet.budgetHint')} />
      <BudgetSlider
        value={draft.budgetMax}
        onChange={(budgetMax) => change({ budgetMax })}
        prices={prices}
      />
      <Text weight="bold" className="mb-2.5 mt-6">
        {t('search.sheet.suggestions')}
      </Text>
      <View className="flex-row flex-wrap justify-between gap-y-2.5">
        {BUDGET_SUGGESTIONS.map((max) => (
          <View key={max} className="w-[48.5%]">
            <Chip
              selected={draft.budgetMax === max}
              onPress={() => change({ budgetMax: max })}
              className="justify-center"
            >
              {t('search.sheet.budgetUpTo', { price: formatPrice(max, locale) })}
            </Chip>
          </View>
        ))}
        <View className="w-[48.5%]">
          <Chip
            selected={draft.budgetMax === undefined}
            onPress={() => change({ budgetMax: undefined })}
            className="justify-center"
          >
            {t('search.noLimit')}
          </Chip>
        </View>
      </View>
    </View>
  );
}

/** Note : toutes, 4 et plus, 4,5 et plus, 5 étoiles (note moyenne du prestataire). */
export function RatingView({ draft, change }: ViewProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { locale } = useLanguage();
  const format = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const star = <Star size={18} color={colors.ochre} fill={colors.ochre} />;
  return (
    <View>
      <Intro title={t('search.sheet.ratingTitle')} />
      <View accessibilityRole="radiogroup" className="gap-2.5">
        <Choice
          label={t('search.sheet.ratingAny')}
          selected={draft.minRating === undefined}
          onPress={() => change({ minRating: undefined })}
        />
        {RATING_OPTIONS.map((rating) => (
          <Choice
            key={rating}
            icon={star}
            label={
              rating === 5
                ? t('search.sheet.ratingFive')
                : t('search.sheet.ratingAtLeast', { value: format(rating) })
            }
            selected={draft.minRating === rating}
            onPress={() => change({ minRating: rating })}
          />
        ))}
      </View>
    </View>
  );
}

const SORTS: ProviderSort[] = ['relevance', 'rating', 'price_asc', 'price_desc'];

/** Tri (déjà proposé avant la refonte : on le garde). */
export function SortView({ draft, change }: ViewProps) {
  const { t } = useTranslation();
  return (
    <View>
      <Intro title={t('search.sheet.sort')} />
      <View accessibilityRole="radiogroup" className="gap-2.5">
        {SORTS.map((sort) => (
          <Choice
            key={sort}
            label={t(`search.sort.${sort}`)}
            selected={(draft.sort ?? 'relevance') === sort}
            onPress={() => change({ sort: sort === 'relevance' ? undefined : sort })}
          />
        ))}
      </View>
    </View>
  );
}

/** Origines culturelles (plusieurs possibles : le moteur garde le prestataire s'il en a une). */
export function OriginsView({ draft, change }: ViewProps) {
  const { t } = useTranslation();
  const origins = useCulturalOrigins();
  const toggle = (slug: string) => {
    const current = draft.origins ?? [];
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
    change({ origins: next.length ? next : undefined });
  };
  return (
    <View>
      <Intro title={t('search.sheet.origins')} />
      <View className="flex-row flex-wrap gap-2">
        {(origins.data ?? []).map((origin) => (
          <Chip
            key={origin.id}
            selected={draft.origins?.includes(origin.slug) ?? false}
            onPress={() => toggle(origin.slug)}
          >
            {origin.name}
          </Chip>
        ))}
      </View>
    </View>
  );
}
