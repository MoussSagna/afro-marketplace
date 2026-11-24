import { formatPrice } from '@afro/common';
import { localeOf } from '@afro/common/i18n';
import i18n from 'i18next';
import { currentLanguage } from '@/i18n/currentLanguage';

/** Le prix « dès 25 € » (« from €25 »), ou « Sur devis » quand le prestataire n'affiche pas de prix. */
export function priceLabel(priceFrom: number | undefined): string {
  if (priceFrom === undefined) return i18n.t('common.onQuote');
  return i18n.t('common.priceFrom', { price: formatPrice(priceFrom, localeOf(currentLanguage())) });
}
