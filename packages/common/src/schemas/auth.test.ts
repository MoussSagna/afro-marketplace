import { describe, expect, it } from 'vitest';
import {
  emailSchema,
  otpCodeSchema,
  passwordSchema,
  passwordStrength,
  signInInputSchema,
  signUpInputSchema,
} from './auth';

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('emailSchema', () => {
  it('nettoie les espaces et les majuscules', () => {
    expect(emailSchema.parse('  Aissatou@Email.FR ')).toBe('aissatou@email.fr');
  });

  it('refuse une adresse invalide', () => {
    expect(firstError(emailSchema.safeParse('aissatou@'))).toBe('Adresse email invalide');
  });
});

describe('passwordSchema', () => {
  it('accepte 8 caractères avec une majuscule et un chiffre', () => {
    expect(passwordSchema.safeParse('Wenzee26').success).toBe(true);
  });

  it('explique chaque règle non respectée', () => {
    expect(firstError(passwordSchema.safeParse('Court1'))).toBe('Au moins 8 caractères');
    expect(firstError(passwordSchema.safeParse('toutenminuscule'))).toBe(
      'Une majuscule et un chiffre',
    );
  });
});

describe('passwordStrength', () => {
  it.each([
    ['', 0],
    ['abc', 1],
    ['Wenzee26', 2],
    ['Wenzee2026!', 3],
    ['WenzeeWenzee26', 3],
  ] as const)('« %s » → %i', (value, expected) => {
    expect(passwordStrength(value)).toBe(expected);
  });
});

describe('otpCodeSchema', () => {
  it('veut exactement 6 chiffres', () => {
    expect(otpCodeSchema.safeParse('123456').success).toBe(true);
    expect(firstError(otpCodeSchema.safeParse('12345'))).toBe('Le code contient 6 chiffres');
    expect(otpCodeSchema.safeParse('12a456').success).toBe(false);
  });
});

describe('signUpInputSchema', () => {
  const valid = {
    firstName: 'Aïssatou',
    email: 'aissatou@email.fr',
    password: 'Wenzee26',
    acceptTerms: true,
  };

  it('accepte une inscription complète', () => {
    expect(signUpInputSchema.safeParse(valid).success).toBe(true);
  });

  it('exige le prénom et l’acceptation des conditions', () => {
    expect(firstError(signUpInputSchema.safeParse({ ...valid, firstName: ' ' }))).toBe(
      'Indique ton prénom',
    );
    expect(firstError(signUpInputSchema.safeParse({ ...valid, acceptTerms: false }))).toBe(
      'Accepte les conditions pour continuer',
    );
  });
});

describe('signInInputSchema', () => {
  it('demande le mot de passe sans imposer ses règles (anciens comptes)', () => {
    expect(signInInputSchema.safeParse({ email: 'a@b.fr', password: 'x' }).success).toBe(true);
    expect(firstError(signInInputSchema.safeParse({ email: 'a@b.fr', password: '' }))).toBe(
      'Indique ton mot de passe',
    );
  });
});
