import { z } from 'zod';
import { idSchema, slugSchema } from './common';

/**
 * Catégorie ou sous-catégorie (« Nourriture » › « Traiteur »).
 * Une catégorie principale n'a pas de parentId.
 */
export const categorySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  slug: slugSchema,
  parentId: idSchema.optional(),
  icon: z.string().optional(),
  order: z.number().int(),
});
