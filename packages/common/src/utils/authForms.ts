import { z } from 'zod';
import {
  authMessages,
  emailSchema,
  otpCodeSchema,
  passwordSchema,
  signUpInputSchema,
} from '../schemas/auth';

/**
 * Le formulaire d'inscription (site) : le schéma de l'API, avec une case « conditions » qui commence
 * décochée (`false`) au lieu d'exiger `true` dès le départ. Le message reste celui de l'API.
 */
export const signUpFormSchema = signUpInputSchema.extend({
  acceptTerms: z.boolean().refine((accepted) => accepted, authMessages.acceptTerms),
});
export type SignUpFormValues = z.input<typeof signUpFormSchema>;

/**
 * Les messages des formulaires « code » et « nouveau mot de passe ».
 * Même texte que `errors.passwordMismatch` (i18n) : l'app le traduit déjà.
 */
export const authFormMessages = {
  passwordMismatch: 'Les deux mots de passe ne sont pas identiques',
  samePassword: 'Choisis un mot de passe différent de l’actuel',
} as const;

/** La saisie du code à 6 chiffres reçu « par email » (fin d'inscription). */
export const otpFormSchema = z.object({ code: otpCodeSchema });
export type OtpFormValues = z.input<typeof otpFormSchema>;

/** Mot de passe oublié, 2ᵉ étape : le code, le nouveau mot de passe et sa confirmation. */
export const resetPasswordFormSchema = z
  .object({
    code: otpCodeSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: authFormMessages.passwordMismatch,
    path: ['confirmPassword'],
  });
export type ResetPasswordFormValues = z.input<typeof resetPasswordFormSchema>;

/** Mot de passe oublié, 1ʳᵉ étape : l'email. */
export const forgotPasswordFormSchema = z.object({ email: emailSchema });
export type ForgotPasswordFormValues = z.input<typeof forgotPasswordFormSchema>;

/** « Mon compte › Sécurité » : le mot de passe actuel, le nouveau et sa confirmation. */
export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, authMessages.passwordRequired),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: authFormMessages.passwordMismatch,
    path: ['confirmPassword'],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: authFormMessages.samePassword,
    path: ['newPassword'],
  });
export type ChangePasswordFormValues = z.input<typeof changePasswordFormSchema>;
