import { z } from 'zod';
import { idSchema } from './common';

/**
 * Catégorie ou sous-catégorie (« Nourriture » › « Traiteur »).
 * Une catégorie principale n'a pas de parentId.
 */
export const categorySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  parentId: idSchema.optional(),
  icon: z.string().optional(),
  order: z.number().int(),
});
