import { z } from 'zod';
import {
  amountInCentsSchema,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  postalCodeSchema,
  text,
  timestamps,
} from './common';

export const eventTypeSchema = z.enum([
  'wedding',
  'birthday',
  'baptism',
  'corporate',
  'funeral',
  'other',
]);

/** Préparé pour les clients professionnels (factures plus tard). */
export const clientTypeSchema = z.enum(['individual', 'business']);

/**
 * pending → quoted → accepted, ou declined / expired / cancelled.
 * Les passages autorisés sont décrits dans rules/quoteRequest.ts.
 */
export const quoteRequestStatusSchema = z.enum([
  'pending',
  'quoted',
  'accepted',
  'declined',
  'expired',
  'cancelled',
]);

/** Une demande de devis : un client, UN prestataire, un événement. */
export const quoteRequestSchema = z.object({
  id: idSchema,
  clientId: idSchema,
  providerId: idSchema,
  /** Si le client part d'une formule précise. */
  offeringId: idSchema.optional(),
  clientType: clientTypeSchema,
  eventType: eventTypeSchema,
  eventDate: isoDateSchema,
  /** L'adresse précise n'est donnée qu'après la réservation. */
  eventCity: z.string().min(1),
  eventPostalCode: postalCodeSchema,
  guestCount: z.number().int().positive().optional(),
  budgetMin: amountInCentsSchema.optional(),
  budgetMax: amountInCentsSchema.optional(),
  message: z.string(),
  status: quoteRequestStatusSchema,
  declineReason: z.string().optional(),
  /** Sans réponse à cette date, la demande expire (7 jours). */
  expiresAt: isoDateTimeSchema,
  ...timestamps,
});

/**
 * Le formulaire de demande de devis (C1).
 * La date dans le futur et la disponibilité du prestataire sont vérifiées
 * par la règle canSendQuoteRequest, car elles dépendent du jour et des données.
 */
export const createQuoteRequestInputSchema = z
  .object({
    providerId: idSchema,
    offeringId: idSchema.optional(),
    clientType: clientTypeSchema,
    eventType: eventTypeSchema,
    // Une date vide (champ non rempli) est refusée avec un message clair.
    eventDate: z.iso.date({ error: 'Choisis la date de l’événement' }),
    eventCity: text(1, 80, 'Indique la ville de l’événement'),
    eventPostalCode: postalCodeSchema,
    guestCount: z.number().int().min(1, 'Au moins 1 invité').max(5000).optional(),
    budgetMin: amountInCentsSchema.optional(),
    budgetMax: amountInCentsSchema.optional(),
    message: text(20, 2000, 'Décris ton besoin en quelques phrases (20 caractères minimum)'),
  })
  .refine(
    (input) =>
      input.budgetMin === undefined ||
      input.budgetMax === undefined ||
      input.budgetMax >= input.budgetMin,
    { message: 'Le budget maximum doit être supérieur au minimum', path: ['budgetMax'] },
  );

/** Le prestataire décline une demande (S3), avec un motif. */
export const declineQuoteRequestInputSchema = z.object({
  reason: text(3, 500, 'Indique un motif'),
});
