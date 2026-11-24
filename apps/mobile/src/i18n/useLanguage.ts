import { localeOf, type Language } from '@afro/common/i18n';
import { useTranslation } from 'react-i18next';

/** La langue affichée (« fr » ou « en ») et son code pour Intl (« fr-FR », « en-GB »). */
export function useLanguage(): { language: Language; locale: string } {
  const { i18n } = useTranslation();
  const language: Language = i18n.language === 'en' ? 'en' : 'fr';
  return { language, locale: localeOf(language) };
}
