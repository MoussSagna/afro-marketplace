import { z } from 'zod';
import { bookingSchema } from './booking';
import { mediaSchema, offeringSchema } from './catalogue';
import { idSchema, isoDateSchema, paginated } from './common';
import { conversationSchema, messageSchema } from './messaging';
import { providerCardSchema, providerProfileSchema, publicProviderProfileSchema } from './provider';
import { quoteSchema } from './quote';
import { quoteRequestSchema } from './quoteRequest';
import { reviewSchema } from './review';
import { publicUserSchema } from './user';

/*
 * Les « vues » : des réponses de l'API qui assemblent plusieurs entités pour
 * un écran précis. Ça évite à l'écran d'enchaîner cinq appels.
 */

/** Une page de résultats de recherche (P2). */
export const providerSearchResultSchema = paginated(providerCardSchema);

/** Tout ce qu'il faut pour la page profil d'un prestataire (P5). */
export const providerDetailsSchema = z.object({
  profile: publicProviderProfileSchema,
  offerings: z.array(offeringSchema),
  media: z.array(mediaSchema),
});

/** Le profil du prestataire connecté, avec ses champs internes (onboarding, motif de refus…). */
export const myProviderDetailsSchema = providerDetailsSchema.extend({
  profile: providerProfileSchema,
});

/** Les jours où le prestataire est indisponible, sans dire pourquoi (vie privée). */
export const unavailableDatesSchema = z.array(isoDateSchema);

/** Un avis accompagné de son auteur (prénom + initiale). */
export const reviewWithAuthorSchema = reviewSchema.extend({ author: publicUserSchema });

/** Une ligne des listes « Mes demandes » (C2) et « Demandes reçues » (S3). */
export const quoteRequestSummarySchema = z.object({
  request: quoteRequestSchema,
  provider: providerCardSchema,
  client: publicUserSchema,
  /** Le dernier devis envoyé, s'il y en a un. */
  latestQuote: quoteSchema.optional(),
  conversationId: idSchema,
});

/** Le détail d'une demande (C3) : tous les devis et la réservation éventuelle. */
export const quoteRequestDetailsSchema = quoteRequestSummarySchema.extend({
  quotes: z.array(quoteSchema),
  booking: bookingSchema.optional(),
});

/** Une ligne de la liste des conversations (C4 / S5). */
export const conversationSummarySchema = z.object({
  conversation: conversationSchema,
  /** L'autre personne de la conversation. */
  otherParticipant: publicUserSchema,
  /** Nom du prestataire concerné (« Saveurs de Dakar »). */
  providerName: z.string().min(1),
  lastMessage: messageSchema.optional(),
  /** Non-lus pour l'utilisateur connecté. */
  unreadCount: z.number().int().nonnegative(),
});

/** Une réservation avec ce qu'il faut pour l'afficher dans une liste. */
export const bookingSummarySchema = z.object({
  booking: bookingSchema,
  provider: providerCardSchema,
  client: publicUserSchema,
  /** L'avis laissé sur cette réservation, s'il existe (règle n° 6 : un seul). */
  review: reviewSchema.optional(),
});

/** Tableau de bord prestataire (S2) : 3 chiffres simples + les listes récentes. */
export const providerDashboardSchema = z.object({
  pendingRequestsCount: z.number().int().nonnegative(),
  upcomingBookingsCount: z.number().int().nonnegative(),
  ratingAverage: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  recentRequests: z.array(quoteRequestSummarySchema),
  upcomingBookings: z.array(bookingSummarySchema),
});

/** Le format des erreurs renvoyées par l'API : un code stable + un message à afficher. */
export const apiErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
});
