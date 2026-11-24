import { DEFAULT_LANGUAGE, pickLanguage, translations, type Language } from '@afro/common/i18n';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * La traduction de l'app (lot M6b), avec i18next : le standard React, comme react-i18next sur le web.
 * - Les textes sont dans `common` (packages/common/src/i18n/fr.ts et en.ts), partagés avec le site plus tard.
 * - La langue est celle du téléphone si on la parle (anglais), sinon le français.
 * Dans un écran : `const { t } = useTranslation();` puis `t('home.searchTitle')`.
 */
export function phoneLanguage(): Language {
  return pickLanguage(getLocales().map((locale) => locale.languageCode));
}

void i18n.use(initReactI18next).init({
  resources: translations,
  lng: phoneLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  // React protège déjà le texte affiché : pas besoin qu'i18next échappe les caractères.
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
