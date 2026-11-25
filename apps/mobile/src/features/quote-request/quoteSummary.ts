import { formatPrice, type QuoteRequestFormValues } from '@afro/common';
import { localeOf } from '@afro/common/i18n';
import i18n from 'i18next';
import { currentLanguage } from '@/i18n/currentLanguage';
import { shortDay } from '@/lib/dates';

/**
 * Le récapitulatif d'une demande, en deux lignes (écran « Demande envoyée », maquette C1) :
 * « Mariage · sam. 14 déc. · 120 invités » puis « Saint-Denis · budget 2 000 € à 3 000 € ».
 */
export function quoteSummary(values: QuoteRequestFormValues): { title: string; detail: string } {
  const locale = localeOf(currentLanguage());
  const euros = (value: string) => formatPrice(Number(value) * 100, locale);
  const guests = values.guestCount.trim();
  const title = [
    values.eventType ? i18n.t(`eventTypes.${values.eventType}`) : undefined,
    values.eventDate ? shortDay(values.eventDate, locale) : undefined,
    guests ? i18n.t('search.guests', { count: Number(guests) }) : undefined,
  ].filter(Boolean);

  const min = values.budgetMin.trim();
  const max = values.budgetMax.trim();
  const budget =
    min && max
      ? i18n.t('quote.budgetRange', { min: euros(min), max: euros(max) })
      : max
        ? i18n.t('quote.budgetUpTo', { max: euros(max) })
        : min
          ? i18n.t('quote.budgetFrom', { min: euros(min) })
          : undefined;
  const detail = [values.eventCity.trim(), budget].filter(Boolean);
  return { title: title.join(' · '), detail: detail.join(' · ') };
}
