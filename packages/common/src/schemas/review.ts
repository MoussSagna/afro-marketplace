import { z } from 'zod';
import { idSchema, isoDateTimeSchema, text, timestamps } from './common';

const ratingSchema = z.number().int().min(1).max(5);

export const subRatingsSchema = z.object({
  quality: ratingSchema,
  punctuality: ratingSchema,
  value: ratingSchema,
});

export const reviewStatusSchema = z.enum(['published', 'hidden']);

/** Un avis : un seul par réservation terminée (règle n° 6). */
export const reviewSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  authorId: idSchema,
  providerId: idSchema,
  rating: ratingSchema,
  subRatings: subRatingsSchema.optional(),
  comment: z.string().optional(),
  photos: z.array(z.url()).optional(),
  /** Une seule réponse publique du prestataire. */
  providerReply: z.string().optional(),
  providerRepliedAt: isoDateTimeSchema.optional(),
  /** « hidden » = masqué par la modération. */
  status: reviewStatusSchema,
  ...timestamps,
});

/** Formulaire « Laisser un avis » (C6). */
export const createReviewInputSchema = z.object({
  bookingId: idSchema,
  rating: z.number().int().min(1, 'Choisis une note').max(5),
  subRatings: subRatingsSchema.optional(),
  comment: text(0, 2000, '').optional(),
});

export const replyToReviewInputSchema = z.object({
  reply: text(2, 1000, 'La réponse est vide'),
});
