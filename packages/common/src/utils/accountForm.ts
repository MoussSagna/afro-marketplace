import { z } from 'zod';
import { authMessages } from '../schemas/auth';
import { frenchPhoneSchema, notificationPrefsSchema, userMessages } from '../schemas/user';
import type { UpdateMeInput, User } from '../types';

/** Le formulaire C8 (site et app). Le téléphone est facultatif : un champ vide le retire. */
export const accountFormSchema = z.object({
  firstName: z.string().trim().min(1, authMessages.firstNameRequired).max(50),
  lastName: z.string().trim().min(1, userMessages.lastNameRequired).max(50),
  phone: z.union([z.literal(''), frenchPhoneSchema]),
  notificationPrefs: notificationPrefsSchema,
});
export type AccountFormValues = z.input<typeof accountFormSchema>;

export const accountDefaults = (user: User): AccountFormValues => ({
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone ?? '',
  notificationPrefs: user.notificationPrefs,
});

export function toUpdateMeInput(values: z.output<typeof accountFormSchema>): UpdateMeInput {
  const { phone, ...rest } = values;
  return { ...rest, ...(phone && { phone }) };
}

/** Les sujets et les canaux des préférences de notification, dans l'ordre d'affichage. */
export const NOTIFICATION_TOPIC_KEYS = ['quotes', 'messages', 'bookings', 'marketing'] as const;
export const NOTIFICATION_CHANNEL_KEYS = ['email', 'sms', 'push'] as const;
