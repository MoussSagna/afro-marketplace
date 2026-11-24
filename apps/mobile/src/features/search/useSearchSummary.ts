import { useCategories, type ProviderSearchFilters } from '@afro/common';
import { useTranslation } from 'react-i18next';
import { useCategoryName } from '@/i18n/useCategoryName';
import { useLanguage } from '@/i18n/useLanguage';
import { shortDay } from './searchDates';

/** Ce que résume la pilule : « Nourriture · Paris » et « sam. 14 déc. · 80 invités ». */
export function useSearchSummary(filters: ProviderSearchFilters) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const categories = useCategories();
  const categoryName = useCategoryName();
  const category = categories.data?.find((c) => c.slug === filters.category);
  const what = filters.q || (category ? categoryName(category) : undefined);
  const hasSearch = Boolean(what || filters.city || filters.date || filters.guests);
  if (!hasSearch) {
    return { hasSearch, title: t('search.pillTitle'), hint: t('search.pillHint') };
  }
  return {
    hasSearch,
    title: [what ?? t('search.anything'), filters.city ?? t('search.anywhere')].join(' · '),
    hint: [
      filters.date ? shortDay(filters.date, locale) : t('search.addDate'),
      filters.guests ? t('search.guests', { count: filters.guests }) : undefined,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}
