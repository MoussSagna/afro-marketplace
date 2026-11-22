import { z } from 'zod';
import { idSchema } from './common';

/** Origine culturelle : filtre transversal (« traiteur » ET « ivoirien »). */
export const culturalOriginSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  region: z.string().optional(),
});
