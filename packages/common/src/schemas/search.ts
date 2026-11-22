import { z } from 'zod';
import { amountInCentsSchema, isoDateSchema, slugSchema } from './common';

export const providerSortSchema = z.enum(['relevance', 'rating', 'price_asc', 'price_desc']);

/**
 * Les filtres de la recherche (P2). Ils vivront dans l'URL au lot 3
 * (« ?categorie=traiteurs&origines=senegal&date=2026-12-31 »).
 */
export const providerSearchFiltersSchema = z.object({
  /** Texte libre : nom, ville… */
  q: z.string().trim().max(100).optional(),
  /** Slug d'une catégorie principale ou d'une sous-catégorie. */
  category: slugSchema.optional(),
  /** Slugs d'origines culturelles (on garde le prestataire s'il en a au moins une). */
  origins: z.array(slugSchema).optional(),
  city: z.string().trim().max(80).optional(),
  /** Ne garder que les prestataires disponibles ce jour-là (règle n° 3). */
  date: isoDateSchema.optional(),
  /** Budget maximum : on compare au prix « à partir de ». */
  budgetMax: amountInCentsSchema.optional(),
  guests: z.number().int().positive().optional(),
  minRating: z.number().min(0).max(5).optional(),
  verifiedOnly: z.boolean().optional(),
  sort: providerSortSchema.optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
});
