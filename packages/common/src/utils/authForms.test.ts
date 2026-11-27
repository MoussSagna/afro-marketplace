import { describe, expect, it } from 'vitest';
import { fr } from '../i18n/fr';
import { authMessages } from '../schemas/auth';
import {
  authFormMessages,
  forgotPasswordFormSchema,
  otpFormSchema,
  resetPasswordFormSchema,
  signUpFormSchema,
} from './authForms';

const valid = {
  firstName: 'Awa',
  email: ' Awa@Example.com ',
  password: 'Bonjour2026',
  acceptTerms: true,
};

describe('signUpFormSchema', () => {
  it('accepte une inscription complète et nettoie l’email', () => {
    const result = signUpFormSchema.parse(valid);
    expect(result.email).toBe('awa@example.com');
  });

  it('refuse une case « conditions » décochée avec le message de l’API', () => {
    const result = signUpFormSchema.safeParse({ ...valid, acceptTerms: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(authMessages.acceptTerms);
  });

  it.each([
    ['court', authMessages.passwordLength],
    ['bonjour2026', authMessages.passwordUpperDigit],
  ])('refuse le mot de passe « %s »', (password, message) => {
    const result = signUpFormSchema.safeParse({ ...valid, password });
    expect(result.error?.issues.map((issue) => issue.message)).toContain(message);
  });

  it('exige un prénom', () => {
    const result = signUpFormSchema.safeParse({ ...valid, firstName: ' ' });
    expect(result.error?.issues[0]?.message).toBe(authMessages.firstNameRequired);
  });
});

describe('otpFormSchema', () => {
  it('accepte 6 chiffres', () => {
    const code = '123456';
    expect(otpFormSchema.safeParse({ code }).success).toBe(true);
  });

  it.each(['12345', '12a456', ''])('refuse « %s »', (code) => {
    expect(otpFormSchema.safeParse({ code }).error?.issues[0]?.message).toBe(
      authMessages.otpFormat,
    );
  });
});

describe('resetPasswordFormSchema', () => {
  const ok = { code: '123456', password: 'Nouveau2026', confirmPassword: 'Nouveau2026' };

  it('accepte un code et deux mots de passe identiques', () => {
    expect(resetPasswordFormSchema.safeParse(ok).success).toBe(true);
  });

  it('signale des mots de passe différents sous la confirmation', () => {
    const result = resetPasswordFormSchema.safeParse({ ...ok, confirmPassword: 'Autre2026' });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['confirmPassword'],
      message: authFormMessages.passwordMismatch,
    });
  });

  it('a un message déjà traduit par l’app', () => {
    expect(fr.errors.passwordMismatch).toBe(authFormMessages.passwordMismatch);
  });
});

describe('forgotPasswordFormSchema', () => {
  it('refuse un email invalide', () => {
    expect(forgotPasswordFormSchema.safeParse({ email: 'awa' }).error?.issues[0]?.message).toBe(
      authMessages.emailInvalid,
    );
  });
});
