import { en } from './en';
import { fr } from './fr';

export type { Translations } from './types';
export { en, fr };

/** Les langues de l'app : le français d'abord (langue par défaut), puis l'anglais. */
export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'fr';

/** Les textes, au format attendu par i18next (`resources`). */
export const translations = {
  fr: { translation: fr },
  en: { translation: en },
} as const;

/**
 * Choisit la langue de l'app à partir des langues préférées du téléphone (« en », « fr »…),
 * dans l'ordre : la première qu'on sait parler gagne ; sinon, le français.
 */
export function pickLanguage(preferred: readonly (string | null | undefined)[]): Language {
  for (const tag of preferred) {
    const code = tag?.toLowerCase().split(/[-_]/)[0];
    const found = SUPPORTED_LANGUAGES.find((language) => language === code);
    if (found) return found;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Les schémas Zod de `common` écrivent leurs messages en français (le site les affiche tels quels).
 * Pour les traduire, on retrouve la clé du message : « Adresse email invalide » → errors.emailInvalid.
 * Renvoie la clé et ses valeurs (ex. { max: 50 }), ou null si le message est inconnu.
 */
export function errorKeyOf(
  message: string,
): { key: string; values?: Record<string, string | number> } | null {
  const max = /^(\d+) caractères maximum$/.exec(message);
  if (max) return { key: 'errors.maxLength', values: { max: Number(max[1]) } };
  const entry = Object.entries(fr.errors).find(([, text]) => text === message);
  return entry ? { key: `errors.${entry[0]}` } : null;
}

/** Le code de date et de nombres d'une langue, pour Intl (« fr-FR », « en-GB »). */
export function localeOf(language: Language): string {
  return language === 'en' ? 'en-GB' : 'fr-FR';
}
