import {
  useCulturalOrigins,
  useProviderSearch,
  type ProviderSearchFilters,
  type ProviderSort,
} from '@afro/common';
import { X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FullScreenModal } from '@/components/FullScreenModal';
import { Button, Chip, Heading, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';
import { BudgetSlider } from './BudgetSlider';

/** Ce que règle le panneau Filtres (le reste, Quoi / Où / Quand / Invités, est dans la pilule). */
export type FiltersDraft = Pick<
  ProviderSearchFilters,
  'sort' | 'budgetMax' | 'minRating' | 'origins' | 'verifiedOnly'
>;

const SORTS: ProviderSort[] = ['relevance', 'rating', 'price_asc', 'price_desc'];
const RATINGS = [undefined, 3, 4, 4.5] as const;

type FiltersSheetProps = {
  visible: boolean;
  filters: ProviderSearchFilters;
  onClose(): void;
  onApply(draft: FiltersDraft): void;
};

/**
 * Les filtres en plein écran (maquette section 8) : tri, budget, note minimale, origines,
 * profils vérifiés. Le bouton du bas compte en direct les prestataires qui correspondent.
 */
export function FiltersSheet({ visible, onClose, ...props }: FiltersSheetProps) {
  return (
    <FullScreenModal visible={visible} onClose={onClose} animationType="slide">
      <FiltersBody onClose={onClose} {...props} />
    </FullScreenModal>
  );
}

function FiltersBody({ filters, onClose, onApply }: Omit<FiltersSheetProps, 'visible'>) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { locale } = useLanguage();
  const origins = useCulturalOrigins();
  // « 4,5 » en français, « 4.5 » en anglais ; « 4 » sans virgule.
  const formatRating = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const [draft, setDraft] = useState<FiltersDraft>(() => ({
    sort: filters.sort,
    budgetMax: filters.budgetMax,
    minRating: filters.minRating,
    origins: filters.origins,
    verifiedOnly: filters.verifiedOnly,
  }));
  const change = (changes: FiltersDraft) => setDraft((d) => ({ ...d, ...changes }));

  // Le nombre de résultats avec ces filtres, en direct (une page d'un seul résultat suffit).
  const count = useProviderSearch({ ...filters, ...draft, page: 1, pageSize: 1 });
  // Les prix de tous les prestataires, pour l'histogramme du budget.
  const all = useProviderSearch({ pageSize: 50 });
  const prices = (all.data?.items ?? []).flatMap((p) =>
    p.priceFrom === undefined ? [] : [p.priceFrom],
  );
  const total = count.data?.total ?? 0;

  const toggleOrigin = (slug: string) => {
    const current = draft.origins ?? [];
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
    change({ origins: next.length ? next : undefined });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="h-14 flex-row items-center justify-center border-b border-border">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('search.close')}
          onPress={onClose}
          className="absolute left-4 h-10 w-10 items-center justify-center"
        >
          <X size={20} color={colors.foreground} />
        </Pressable>
        <Text weight="bold">{t('search.filters')}</Text>
      </View>
      <ScrollView>
        <Section title={t('search.sortTitle')}>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {SORTS.map((sort) => (
              <Chip
                key={sort}
                selected={(draft.sort ?? 'relevance') === sort}
                onPress={() => change({ sort: sort === 'relevance' ? undefined : sort })}
              >
                {t(`search.sort.${sort}`)}
              </Chip>
            ))}
          </View>
        </Section>
        <Section title={t('search.budgetTitle')} hint={t('search.budgetHint')}>
          <BudgetSlider
            value={draft.budgetMax}
            onChange={(budgetMax) => change({ budgetMax })}
            prices={prices}
          />
        </Section>
        <Section title={t('search.ratingTitle')}>
          <View className="mt-3 flex-row gap-1 rounded-full bg-muted p-1">
            {RATINGS.map((rating) => {
              const on = draft.minRating === rating;
              const label =
                rating === undefined
                  ? t('search.ratingAll')
                  : t('search.ratingAtLeast', { value: formatRating(rating) });
              return (
                <Pressable
                  key={String(rating)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={label}
                  onPress={() => change({ minRating: rating })}
                  className={cn('flex-1 items-center rounded-full py-2', on && 'bg-card')}
                >
                  <Text size="xs" weight="semibold" tone={on ? 'default' : 'muted'}>
                    {rating === undefined ? label : `${formatRating(rating)}+`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>
        <Section title={t('search.originsTitle')}>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {(origins.data ?? []).map((origin) => (
              <Chip
                key={origin.id}
                selected={draft.origins?.includes(origin.slug) ?? false}
                onPress={() => toggleOrigin(origin.slug)}
              >
                {origin.name}
              </Chip>
            ))}
          </View>
        </Section>
        <View className="flex-row items-center gap-3 px-5 py-5">
          <View className="flex-1">
            <Text weight="semibold">{t('search.verifiedTitle')}</Text>
            <Text size="xs" tone="muted">
              {t('search.verifiedHint')}
            </Text>
          </View>
          <Switch
            accessibilityLabel={t('search.verifiedTitle')}
            value={draft.verifiedOnly ?? false}
            onValueChange={(on) => change({ verifiedOnly: on || undefined })}
            trackColor={{ true: colors.success, false: colors.input }}
          />
        </View>
      </ScrollView>
      <View className="flex-row items-center justify-between border-t border-border bg-card px-5 pb-2 pt-3.5">
        <Pressable accessibilityRole="button" onPress={() => setDraft({})}>
          <Text weight="semibold" className="underline">
            {t('search.clearAll')}
          </Text>
        </Pressable>
        <Button variant="primary" onPress={() => onApply(draft)}>
          {t('search.showResults', { count: total })}
        </Button>
      </View>
    </SafeAreaView>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View className="border-b border-border px-5 py-5">
      <Heading level={3}>{title}</Heading>
      {hint ? (
        <Text size="sm" tone="muted">
          {hint}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
