import { describe, expect, it } from 'vitest';
import { authMessages, passwordRules } from '../schemas/auth';
import { formatPrice } from '../utils/formatPrice';
import { en, errorKeyOf, fr, localeOf, pickLanguage } from './index';

/** Toutes les clés d'un arbre de textes : « auth.strength.weak »… */
function keys(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keys(value as object, `${prefix}${key}.`),
  );
}

/** Les variables d'un texte : « {{name}} » → ['name']. */
function variables(text: string): string[] {
  return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]!).sort();
}

function get(tree: object, path: string): string {
  return path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], tree) as string;
}

describe('Traductions (lot M6b)', () => {
  it('l’anglais a exactement les mêmes clés que le français', () => {
    expect(keys(en).sort()).toEqual(keys(fr).sort());
  });

  it('aucun texte n’est vide, et les {{variables}} sont les mêmes dans les deux langues', () => {
    for (const key of keys(fr)) {
      expect(get(fr, key).trim(), key).not.toBe('');
      expect(get(en, key).trim(), key).not.toBe('');
      expect(variables(get(en, key)), key).toEqual(variables(get(fr, key)));
    }
  });

  it('chaque message d’erreur des schémas de connexion a sa traduction', () => {
    for (const message of Object.values(authMessages)) {
      const found = errorKeyOf(message);
      expect(found, message).not.toBeNull();
      expect(get(en, found!.key)).toBeTruthy();
    }
    expect(errorKeyOf('50 caractères maximum')).toEqual({
      key: 'errors.maxLength',
      values: { max: 50 },
    });
    expect(errorKeyOf('Message inconnu')).toBeNull();
  });

  it('chaque règle du mot de passe a son texte', () => {
    for (const rule of passwordRules) {
      expect(fr.auth.passwordRules[rule.id]).toBe(rule.label);
      expect(en.auth.passwordRules[rule.id]).toBeTruthy();
    }
  });

  it('choisit la langue du téléphone si on la parle, sinon le français', () => {
    expect(pickLanguage(['en-US', 'fr-FR'])).toBe('en');
    expect(pickLanguage(['de-DE', 'fr-CA'])).toBe('fr');
    expect(pickLanguage(['es-ES'])).toBe('fr');
    expect(pickLanguage([null, undefined])).toBe('fr');
    expect(pickLanguage([])).toBe('fr');
  });

  it('formate les prix dans la langue choisie', () => {
    expect(formatPrice(2500)).toMatch(/^25\s€$/);
    expect(formatPrice(1250, localeOf('en'))).toBe('€12.50');
    expect(formatPrice(2500, localeOf('en'))).toBe('€25');
  });
});
