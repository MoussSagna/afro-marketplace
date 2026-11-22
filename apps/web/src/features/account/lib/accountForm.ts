import {
  frenchPhoneSchema,
  notificationPrefsSchema,
  type UpdateMeInput,
  type User,
} from '@afro/common';
import { z } from 'zod';

/** Le formulaire C8. Le téléphone est facultatif : un champ vide le retire. */
export const accountFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Indique ton prénom').max(50),
  lastName: z.string().trim().min(1, 'Indique ton nom').max(50),
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

/** Les lignes du tableau des préférences de notification. */
export const NOTIFICATION_TOPICS = [
  { key: 'quotes', label: 'Demandes et devis' },
  { key: 'messages', label: 'Messages' },
  { key: 'bookings', label: 'Réservations et rappels' },
  { key: 'marketing', label: 'Nouveautés et bons plans' },
] as const;

export const NOTIFICATION_CHANNELS = [
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'push', label: 'Notification' },
] as const;
