import { z } from 'zod';
import { postalCodeSchema } from '../schemas/common';
import {
  clientTypeSchema,
  createQuoteRequestInputSchema,
  eventTypeSchema,
  quoteRequestMessages as m,
} from '../schemas/quoteRequest';
import type { CreateQuoteRequestInput } from '../types';

/** Un champ nombre facultatif : vide = pas de valeur ; sinon un entier dans les bornes. */
const optionalInteger = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), m.wholeNumber)
    .refine(
      // Seulement si c'est bien un nombre : sinon le message précédent suffit.
      (value) => !/^\d+$/.test(value) || (Number(value) >= min && Number(value) <= max),
      message,
    );

/**
 * Le formulaire C1, tel que l'utilisateur le remplit (site et app).
 *
 * Pourquoi un schéma à part de `createQuoteRequestInputSchema` ? Les champs
 * renvoient toujours du texte (« 150 », « » pour un champ vide) et le
 * budget se saisit en euros, alors que l'API attend des nombres et des
 * centimes. On valide la saisie ici, puis `toCreateQuoteRequestInput`
 * fait la conversion.
 */
export const quoteRequestFormSchema = z
  .object({
    clientType: clientTypeSchema,
    eventType: z.union([eventTypeSchema, z.literal('')]).refine((value) => value !== '', {
      message: m.eventTypeRequired,
    }),
    eventDate: z.iso.date({ error: m.eventDateRequired }),
    eventCity: z.string().trim().min(1, m.eventCityRequired).max(80),
    eventPostalCode: postalCodeSchema,
    guestCount: optionalInteger(1, 5000, m.guestRange),
    budgetMin: optionalInteger(0, 1_000_000, m.budgetInvalid),
    budgetMax: optionalInteger(0, 1_000_000, m.budgetInvalid),
    message: z.string().trim().min(20, m.messageTooShort).max(2000, '2000 caractères maximum'),
  })
  .refine(
    ({ budgetMin, budgetMax }) =>
      budgetMin === '' || budgetMax === '' || Number(budgetMax) >= Number(budgetMin),
    { message: m.budgetOrder, path: ['budgetMax'] },
  );

export type QuoteRequestFormValues = z.input<typeof quoteRequestFormSchema>;

export const emptyQuoteRequestForm: QuoteRequestFormValues = {
  clientType: 'individual',
  eventType: '',
  eventDate: '',
  eventCity: '',
  eventPostalCode: '',
  guestCount: '',
  budgetMin: '',
  budgetMax: '',
  message: '',
};

const toNumber = (value: string) => (value.trim() === '' ? undefined : Number(value));
const eurosToCents = (value: string) => {
  const euros = toNumber(value);
  return euros === undefined ? undefined : euros * 100;
};

/** Convertit la saisie (texte, euros) en données pour l'API (nombres, centimes). */
export function toCreateQuoteRequestInput(
  values: QuoteRequestFormValues,
  ids: { providerId: string; offeringId?: string },
): CreateQuoteRequestInput {
  return createQuoteRequestInputSchema.parse({
    ...ids,
    clientType: values.clientType,
    eventType: values.eventType,
    eventDate: values.eventDate,
    eventCity: values.eventCity.trim(),
    eventPostalCode: values.eventPostalCode,
    guestCount: toNumber(values.guestCount),
    budgetMin: eurosToCents(values.budgetMin),
    budgetMax: eurosToCents(values.budgetMax),
    message: values.message.trim(),
  });
}
