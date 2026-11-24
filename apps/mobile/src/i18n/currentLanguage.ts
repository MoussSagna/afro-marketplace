import type { Language } from '@afro/common/i18n';
import i18n from 'i18next';

/** La langue de l'app en ce moment, pour les fonctions hors composants (formatRating, priceLabel…). */
export function currentLanguage(): Language {
  return i18n.language === 'en' ? 'en' : 'fr';
}
