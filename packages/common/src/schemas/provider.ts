import { z } from 'zod';
import { amountInCentsSchema, idSchema } from './common';

export const providerStatusSchema = z.enum([
  'draft',
  'pending_review',
  'changes_requested',
  'published',
  'rejected',
  'paused',
  'suspended',
]);

/**
 * Version allégée d'un profil prestataire, telle que l'API la renvoie
 * pour les listes (accueil, résultats de recherche).
 * Le profil complet (ProviderProfile) arrivera au lot 1.
 */
export const providerCardSchema = z.object({
  id: idSchema,
  slug: z.string().min(1),
  displayName: z.string().min(1),
  coverUrl: z.url().optional(),
  city: z.string().min(1),
  categoryIds: z.array(idSchema).min(1),
  culturalOriginIds: z.array(idSchema),
  /** Prix « à partir de », en centimes. Absent si tout est sur devis. */
  priceFrom: amountInCentsSchema.optional(),
  ratingAverage: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  isProVerified: z.boolean(),
});
