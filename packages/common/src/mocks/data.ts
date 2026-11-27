import { z } from 'zod';
import {
  bookingSchema,
  categorySchema,
  conversationSchema,
  culturalOriginSchema,
  eventProviderSchema,
  eventSchema,
  mediaSchema,
  messageSchema,
  moderationActionSchema,
  offeringSchema,
  providerProfileSchema,
  quoteRequestSchema,
  quoteSchema,
  reportSchema,
  reviewSchema,
  unavailabilitySchema,
  userSchema,
} from '../schemas';

/**
 * Le contenu complet de la base mockée : une « table » (un tableau) par entité.
 * Le schéma sert à vérifier le seed dans les tests, et à relire sans risque
 * ce qui a été sauvegardé dans le localStorage.
 */
export const mockDataSchema = z.object({
  users: z.array(userSchema),
  providers: z.array(providerProfileSchema),
  categories: z.array(categorySchema),
  culturalOrigins: z.array(culturalOriginSchema),
  offerings: z.array(offeringSchema),
  media: z.array(mediaSchema),
  unavailabilities: z.array(unavailabilitySchema),
  quoteRequests: z.array(quoteRequestSchema),
  quotes: z.array(quoteSchema),
  bookings: z.array(bookingSchema),
  conversations: z.array(conversationSchema),
  messages: z.array(messageSchema),
  reviews: z.array(reviewSchema),
  reports: z.array(reportSchema),
  moderationActions: z.array(moderationActionSchema),
  /*
   * Connexion par email (lot M5), SIMULÉE : en démo, le mot de passe est gardé en clair
   * dans la base du téléphone ou du navigateur. Le vrai back-end (Supabase Auth) ne le fera jamais.
   * `.default([])` : une ancienne sauvegarde sans ces tables reste lisible.
   */
  credentials: z
    .array(z.object({ userId: z.string().min(1), email: z.string(), password: z.string() }))
    .default([]),
  /** Planificateur d'événements (27/11/2026). `.default([])` : une ancienne sauvegarde reste lisible. */
  events: z.array(eventSchema).default([]),
  eventProviders: z.array(eventProviderSchema).default([]),
  /** Inscriptions en attente du code de vérification. */
  pendingSignUps: z
    .array(
      z.object({
        email: z.string(),
        firstName: z.string(),
        password: z.string(),
        createdAt: z.string(),
      }),
    )
    .default([]),
});

export type MockData = z.infer<typeof mockDataSchema>;
