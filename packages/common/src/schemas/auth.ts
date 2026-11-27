import { z } from 'zod';
import { text } from './common';

/*
 * Connexion et inscription par email (lot M5 de l'app mobile).
 * Pas encore de back-end : le faux serveur (mocks/handlers/auth.ts) simule les routes,
 * avec un code de vérification de démo toujours égal à DEMO_OTP_CODE.
 * Supabase Auth prendra le relais au lot 10, avec les mêmes schémas.
 */

/**
 * Les messages d'erreur des formulaires de connexion, en français.
 * Le site les affiche tels quels ; l'app les traduit (voir i18n/, clés « errors.* »).
 */
export const authMessages = {
  emailInvalid: 'Adresse email invalide',
  passwordTooLong: 'Mot de passe trop long (72 caractères maximum)',
  passwordLength: 'Au moins 8 caractères',
  passwordUpperDigit: 'Une majuscule et un chiffre',
  otpFormat: 'Le code contient 6 chiffres',
  firstNameRequired: 'Indique ton prénom',
  acceptTerms: 'Accepte les conditions pour continuer',
  passwordRequired: 'Indique ton mot de passe',
} as const;

/** Le code reçu « par email » en démo (aucun email n'est envoyé). */
export const DEMO_OTP_CODE = '123456';

/** Un email, nettoyé (espaces, majuscules) avant d'être vérifié. */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email(authMessages.emailInvalid));

/** Les règles d'un mot de passe, une par une (affichées et cochées en direct sur l'écran). */
export const passwordRules = [
  {
    id: 'length',
    label: authMessages.passwordLength,
    test: (value: string) => value.length >= 8,
  },
  {
    id: 'upper-digit',
    label: authMessages.passwordUpperDigit,
    test: (value: string) => /[A-Z]/.test(value) && /\d/.test(value),
  },
] as const;

export const passwordSchema = z
  .string()
  .max(72, authMessages.passwordTooLong)
  .refine(passwordRules[0].test, passwordRules[0].label)
  .refine(passwordRules[1].test, passwordRules[1].label);

/** Force d'un mot de passe, pour la jauge de l'inscription : de 0 (vide) à 3 (bon). */
export function passwordStrength(value: string): 0 | 1 | 2 | 3 {
  if (!value) return 0;
  const passed = passwordRules.filter((rule) => rule.test(value)).length;
  if (passed < passwordRules.length) return 1;
  return value.length >= 12 || /[^A-Za-z0-9]/.test(value) ? 3 : 2;
}

/** Le code de vérification : exactement 6 chiffres. */
export const otpCodeSchema = z.string().regex(/^\d{6}$/, authMessages.otpFormat);

/** Pourquoi on vérifie un code : fin d'inscription, ou mot de passe oublié. */
export const otpPurposeSchema = z.enum(['sign-up', 'reset-password']);

export const signUpInputSchema = z.object({
  firstName: text(1, 50, authMessages.firstNameRequired),
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal(true, authMessages.acceptTerms),
});

export const verifyOtpInputSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  purpose: otpPurposeSchema,
});

export const resendOtpInputSchema = z.object({
  email: emailSchema,
  purpose: otpPurposeSchema,
});

export const signInInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, authMessages.passwordRequired),
});

export const forgotPasswordInputSchema = z.object({ email: emailSchema });

/** « Mon compte › Sécurité » : changer son mot de passe en donnant l'actuel. */
export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1, authMessages.passwordRequired),
  newPassword: passwordSchema,
});

export const resetPasswordInputSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  password: passwordSchema,
});

/** Réponse à l'inscription : le code a été « envoyé » à cette adresse. */
export const signUpResultSchema = z.object({ email: z.email() });
