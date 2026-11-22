import type { z } from 'zod';
import type {
  categorySchema,
  culturalOriginSchema,
  providerCardSchema,
  providerStatusSchema,
} from '../schemas';

// Les types sont DÉDUITS des schémas Zod : on n'écrit jamais deux fois la même chose.
export type Category = z.infer<typeof categorySchema>;
export type CulturalOrigin = z.infer<typeof culturalOriginSchema>;
export type ProviderCard = z.infer<typeof providerCardSchema>;
export type ProviderStatus = z.infer<typeof providerStatusSchema>;
