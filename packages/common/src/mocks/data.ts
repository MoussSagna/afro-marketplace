import { z } from 'zod';
import {
  bookingSchema,
  categorySchema,
  conversationSchema,
  culturalOriginSchema,
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
});

export type MockData = z.infer<typeof mockDataSchema>;
