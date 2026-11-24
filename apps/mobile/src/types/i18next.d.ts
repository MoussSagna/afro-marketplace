// Les clés de traduction sont vérifiées par TypeScript : t('home.searchTitl') ne compile pas.
import 'i18next';
import type { fr } from '@afro/common/i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof fr };
  }
}
