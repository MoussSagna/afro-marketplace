import { z } from 'zod';
import { idSchema, slugSchema } from './common';

/** Origine culturelle : filtre transversal (« traiteur » ET « ivoirien »). */
export const culturalOriginSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  slug: slugSchema,
  /** Pour regrouper dans les filtres (« Afrique de l'Ouest », « Caraïbes »). */
  region: z.string().optional(),
});
