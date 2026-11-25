import { z } from 'zod';
import { idSchema, text, timestamps } from './common';

/** Les messages d'erreur du compte (traduits via errorKeyOf, voir i18n/fr.ts). */
export const userMessages = {
  lastNameRequired: 'Indique ton nom',
  phoneInvalid: 'Numéro de téléphone invalide',
} as const;

export const userRoleSchema = z.enum(['client', 'provider', 'admin']);
export const userStatusSchema = z.enum(['active', 'suspended', 'banned', 'deleted']);
export const authProviderSchema = z.enum(['email', 'google', 'apple']);

/** Pour un type de notification : par quels canaux prévenir l'utilisateur. */
const notificationChannelsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean(),
});

export const notificationPrefsSchema = z.object({
  /** Nouvelles demandes, nouveaux devis */
  quotes: notificationChannelsSchema,
  messages: notificationChannelsSchema,
  /** Confirmations, rappels avant l'événement, invitation à laisser un avis */
  bookings: notificationChannelsSchema,
  marketing: notificationChannelsSchema,
});

/** Téléphone français : 06 12 34 56 78, 0612345678, +33 6 12 34 56 78… */
export const frenchPhoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/, userMessages.phoneInvalid);

/** Toute personne inscrite : client, prestataire (via son profil) ou admin. */
export const userSchema = z.object({
  id: idSchema,
  email: z.email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  /** Jamais montré aux autres utilisateurs avant une réservation. */
  phone: frenchPhoneSchema.optional(),
  avatarUrl: z.url().optional(),
  /** Un compte peut cumuler les rôles. Tout le monde est « client » par défaut. */
  roles: z.array(userRoleSchema).min(1),
  authProvider: authProviderSchema,
  /** « deleted » = compte anonymisé (RGPD) sans casser l'historique. */
  status: userStatusSchema,
  notificationPrefs: notificationPrefsSchema,
  ...timestamps,
});

/**
 * Ce qu'on montre d'un utilisateur aux AUTRES utilisateurs : prénom et initiale.
 * Ni email, ni téléphone, ni nom complet.
 */
export const publicUserSchema = z.object({
  id: idSchema,
  firstName: z.string().min(1),
  lastNameInitial: z.string().max(2),
  avatarUrl: z.url().optional(),
});

/** Formulaire « Mon compte » (C8). */
export const updateMeInputSchema = z.object({
  firstName: text(1, 50, 'Indique ton prénom'),
  lastName: text(1, 50, userMessages.lastNameRequired),
  phone: frenchPhoneSchema.optional(),
  notificationPrefs: notificationPrefsSchema,
});

/** Un compte de la page de connexion de démo (« Aïssatou, cliente »). */
export const demoAccountSchema = z.object({
  userId: idSchema,
  label: z.string().min(1),
  description: z.string().min(1),
  roles: z.array(userRoleSchema).min(1),
});

/** Session ouverte : l'utilisateur connecté et le jeton à renvoyer à l'API. */
export const sessionSchema = z.object({
  user: userSchema,
  token: z.string().min(1),
});
