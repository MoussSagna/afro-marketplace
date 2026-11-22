import { z } from 'zod';
import { amountInCentsSchema, idSchema, isoDateSchema, text, timestamps } from './common';

/** Comment le prix d'une formule est exprimé. `fixed` servira à la réservation directe (V2). */
export const pricingTypeSchema = z.enum(['from', 'fixed', 'per_person', 'on_quote']);

/** Une prestation / formule proposée par un prestataire (« Buffet mariage 50 personnes »). */
export const offeringSchema = z.object({
  id: idSchema,
  providerId: idSchema,
  categoryId: idSchema,
  title: z.string().min(1),
  description: z.string(),
  pricingType: pricingTypeSchema,
  /** Vide si « sur devis ». */
  price: amountInCentsSchema.optional(),
  durationMinutes: z.number().int().positive().optional(),
  minGuests: z.number().int().positive().optional(),
  maxGuests: z.number().int().positive().optional(),
  isActive: z.boolean(),
  ...timestamps,
});

/** Formulaire d'ajout ou de modification d'une formule. */
export const offeringInputSchema = z
  .object({
    categoryId: idSchema,
    title: text(3, 100, 'Le titre est trop court'),
    description: text(0, 2000, ''),
    pricingType: pricingTypeSchema,
    price: amountInCentsSchema.optional(),
    durationMinutes: z.number().int().positive().optional(),
    minGuests: z.number().int().positive().optional(),
    maxGuests: z.number().int().positive().optional(),
    isActive: z.boolean(),
  })
  .refine((o) => o.pricingType === 'on_quote' || (o.price !== undefined && o.price > 0), {
    message: 'Indique un prix (ou choisis « sur devis »)',
    path: ['price'],
  })
  .refine((o) => !o.minGuests || !o.maxGuests || o.minGuests <= o.maxGuests, {
    message: 'Le maximum doit être supérieur ou égal au minimum',
    path: ['maxGuests'],
  });

export const mediaTypeSchema = z.enum(['image', 'video']);

/** Une photo ou vidéo de la galerie d'un prestataire. */
export const mediaSchema = z.object({
  id: idSchema,
  providerId: idSchema,
  type: mediaTypeSchema,
  url: z.url(),
  thumbnailUrl: z.url().optional(),
  caption: z.string().optional(),
  order: z.number().int().min(0),
  ...timestamps,
});

export const mediaInputSchema = z.object({
  type: mediaTypeSchema,
  url: z.url(),
  caption: text(0, 200, '').optional(),
});

/**
 * Une date bloquée. On ne stocke QUE les indisponibilités :
 * par défaut, un prestataire est disponible.
 */
export const unavailabilitySchema = z.object({
  id: idSchema,
  providerId: idSchema,
  date: isoDateSchema,
  /** « booking » = créée automatiquement par une réservation. */
  reason: z.enum(['manual', 'booking']),
  bookingId: idSchema.optional(),
  ...timestamps,
});
