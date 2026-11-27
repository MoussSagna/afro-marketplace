import { describe, expect, it } from 'vitest';
import { fr } from '../i18n/fr';
import { authMessages } from '../schemas/auth';
import {
  authFormMessages,
  changePasswordFormSchema,
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

describe('changePasswordFormSchema', () => {
  const valid = {
    currentPassword: 'Wenzee2026',
    newPassword: 'Nouveau2027',
    confirmPassword: 'Nouveau2027',
  };

  it('accepte un nouveau mot de passe valide et confirmé', () => {
    expect(changePasswordFormSchema.safeParse(valid).success).toBe(true);
  });

  it('exige le mot de passe actuel', () => {
    const result = changePasswordFormSchema.safeParse({ ...valid, currentPassword: '' });
    expect(result.error?.issues[0]?.path).toEqual(['currentPassword']);
  });

  it('signale une confirmation différente', () => {
    const result = changePasswordFormSchema.safeParse({ ...valid, confirmPassword: 'Autre2027' });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['confirmPassword'],
      message: authFormMessages.passwordMismatch,
    });
  });

  it('refuse un nouveau mot de passe identique à l’actuel ou trop faible', () => {
    const same = changePasswordFormSchema.safeParse({
      currentPassword: 'Wenzee2026',
      newPassword: 'Wenzee2026',
      confirmPassword: 'Wenzee2026',
    });
    expect(same.error?.issues[0]).toMatchObject({
      path: ['newPassword'],
      message: authFormMessages.samePassword,
    });
    const weak = changePasswordFormSchema.safeParse({
      ...valid,
      newPassword: 'court',
      confirmPassword: 'court',
    });
    expect(weak.error?.issues.some((i) => i.path[0] === 'newPassword')).toBe(true);
  });
});
