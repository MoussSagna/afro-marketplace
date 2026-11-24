import {
  CANCELLATION_POLICIES,
  formatPrice,
  type CancellationPolicy,
  type Offering,
} from '@afro/common';
import { localeOf } from '@afro/common/i18n';
import i18n from 'i18next';
import { currentLanguage } from '@/i18n/currentLanguage';

/*
 * Les petits textes du profil (prix d'une formule, invités, durée, langues, annulation),
 * dans la langue de l'app. Ce sont des fonctions simples, testées à part (profileText.test.ts).
 */

const price = (cents: number) => formatPrice(cents, localeOf(currentLanguage()));

/** « À partir de 900 € », « 25 € / pers. », « 450 € » ou « Sur devis ». */
export function offeringPrice(offering: Pick<Offering, 'pricingType' | 'price'>): string {
  if (offering.pricingType === 'on_quote' || offering.price === undefined)
    return i18n.t('common.onQuote');
  const value = price(offering.price);
  if (offering.pricingType === 'from') return i18n.t('profile.priceFromOffering', { price: value });
  if (offering.pricingType === 'per_person')
    return i18n.t('profile.pricePerPerson', { price: value });
  return value;
}

/** « De 30 à 200 invités », « Jusqu’à 80 invités »… ou rien si la formule ne le dit pas. */
export function guestsLabel(offering: Pick<Offering, 'minGuests' | 'maxGuests'>) {
  const { minGuests: min, maxGuests: max } = offering;
  if (min && max) return i18n.t('profile.guestsRange', { min, max });
  if (max) return i18n.t('profile.guestsMax', { max });
  if (min) return i18n.t('profile.guestsMin', { min });
  return undefined;
}

/** « 3 h », « 1 h 30 », « 45 min ». */
export function durationLabel(minutes: number | undefined) {
  if (!minutes) return undefined;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return i18n.t('profile.durationMinutes', { minutes: rest });
  if (rest === 0) return i18n.t('profile.durationHours', { hours });
  return i18n.t('profile.durationHoursMinutes', {
    hours,
    minutes: String(rest).padStart(2, '0'),
  });
}

/** Le nom d'une langue à partir de son code (« wolof » → « Wolof », « en » → « Anglais »). */
export function languageName(code: string): string {
  const key = `languages.${code}`;
  if (i18n.exists(key)) return i18n.t(key as 'languages.fr');
  return code.charAt(0).toUpperCase() + code.slice(1);
}

/** « environ 3 h », ou « environ 2 jours » au-delà d'une journée. */
export function responseTimeLabel(hours: number): string {
  if (hours < 24) return i18n.t('profile.responseHours', { count: Math.max(1, Math.round(hours)) });
  return i18n.t('profile.responseDays', { count: Math.round(hours / 24) });
}

/** Les lignes de la politique d'annulation (mêmes règles que le site, dans la langue de l'app). */
export function cancellationLines(policy: CancellationPolicy): string[] {
  const { tiers } = CANCELLATION_POLICIES[policy];
  const lines = tiers.map((tier) =>
    tier.refundPercent === 100
      ? i18n.t('profile.refundFull', { days: tier.minDaysBefore })
      : i18n.t('profile.refundPart', { percent: tier.refundPercent, days: tier.minDaysBefore }),
  );
  const last = tiers[tiers.length - 1];
  if (last) lines.push(i18n.t('profile.refundNone', { days: last.minDaysBefore }));
  return lines;
}
