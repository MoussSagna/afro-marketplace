import { z } from 'zod';
import {
  amountInCentsSchema,
  idSchema,
  isoDateSchema,
  percentSchema,
  text,
  timestamps,
} from './common';

/** « superseded » = remplacé par une version plus récente du devis. */
export const quoteStatusSchema = z.enum(['sent', 'accepted', 'declined', 'expired', 'superseded']);

/** Une ligne de devis : « Plat principal : thiéboudienne », 50 × 18 €. */
export const quoteLineSchema = z.object({
  id: idSchema,
  quoteId: idSchema,
  label: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: amountInCentsSchema,
});

/**
 * Un devis. Une demande peut en recevoir plusieurs versions (négociation),
 * une seule peut être acceptée. Les lignes sont renvoyées avec le devis.
 */
export const quoteSchema = z.object({
  id: idSchema,
  quoteRequestId: idSchema,
  version: z.number().int().positive(),
  lines: z.array(quoteLineSchema).min(1),
  /** Somme des lignes (voir computeQuoteTotal). */
  totalAmount: amountInCentsSchema,
  depositRate: percentSchema,
  validUntil: isoDateSchema,
  conditions: z.string().optional(),
  status: quoteStatusSchema,
  ...timestamps,
});

export const quoteLineInputSchema = z.object({
  label: text(2, 200, 'Décris la ligne'),
  quantity: z.number().int().min(1, 'Quantité minimale : 1').max(10000),
  unitPrice: amountInCentsSchema,
});

/** Le formulaire de devis (S4). Le total est calculé, jamais saisi. */
export const createQuoteInputSchema = z.object({
  quoteRequestId: idSchema,
  lines: z.array(quoteLineInputSchema).min(1, 'Ajoute au moins une ligne').max(30),
  depositRate: z.number().int().min(0).max(100),
  validUntil: isoDateSchema,
  conditions: text(0, 2000, '').optional(),
});

/** Les messages d'erreur d'acceptation (traduits via errorKeyOf, voir i18n/fr.ts). */
export const acceptQuoteMessages = {
  eventAddressRequired: 'Indique l’adresse de l’événement',
} as const;

/** Le client accepte un devis : il donne alors l'adresse précise de l'événement. */
export const acceptQuoteInputSchema = z.object({
  eventAddress: text(5, 200, acceptQuoteMessages.eventAddressRequired),
});
