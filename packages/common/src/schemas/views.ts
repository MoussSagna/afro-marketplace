import { z } from 'zod';
import { bookingSchema } from './booking';
import { mediaSchema, offeringSchema } from './catalogue';
import { idSchema, isoDateSchema, isoDateTimeSchema, paginated } from './common';
import { conversationSchema, messageSchema } from './messaging';
import { providerCardSchema, providerProfileSchema, publicProviderProfileSchema } from './provider';
import { quoteSchema } from './quote';
import { quoteRequestSchema } from './quoteRequest';
import { reviewSchema } from './review';
import {
  moderationActionSchema,
  moderationActionTypeSchema,
  reportReasonSchema,
  reportSchema,
} from './moderation';
import { publicUserSchema, userSchema } from './user';

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

// ------------------------------------------------------------ Administration (lot 8)

/** A1 : les chiffres de la vue d'ensemble admin. */
export const adminOverviewSchema = z.object({
  providersToReview: z.number().int().nonnegative(),
  openReports: z.number().int().nonnegative(),
  publishedProviders: z.number().int().nonnegative(),
  users: z.number().int().nonnegative(),
});

/**
 * A1 : un événement de l'activité récente, lu dans les vraies tables (comptes, profils,
 * signalements, journal de modération). Rien n'est inventé : pas de table « activité » à part.
 */
export const adminActivityItemSchema = z.object({
  /** Unique dans la liste (« user-…:created », « mod-12 »…). */
  id: z.string(),
  type: z.enum([
    /** Un compte client a été créé. */
    'account_created',
    /** Un profil prestataire a été créé (inscription prestataire). */
    'provider_created',
    /** Un profil a été envoyé en validation (il attend l'admin). */
    'provider_submitted',
    /** Un signalement a été fait. */
    'report_created',
    /** Une décision d'admin (journal de modération). */
    'moderation',
  ]),
  at: isoDateTimeSchema,
  /** Qui ou quoi est concerné : « Aïssatou N. », « Kompa Vibes Haïti », « Avis de Grace M. »… */
  subject: z.string(),
  /** Pour `moderation` : la décision prise. */
  action: moderationActionTypeSchema.optional(),
  /** Pour `report_created` : le motif. */
  reason: reportReasonSchema.optional(),
  /** La page d'admin à ouvrir pour en savoir plus, s'il y en a une. */
  href: z.string().optional(),
});

/** A2 : la fiche d'un profil à valider, avec son propriétaire et l'historique de modération. */
export const adminProviderDetailsSchema = myProviderDetailsSchema.extend({
  owner: userSchema,
  history: z.array(moderationActionSchema),
});

/** A3 : un signalement, avec qui l'a fait et un aperçu de ce qui est signalé. */
export const adminReportSchema = reportSchema.extend({
  reporter: publicUserSchema,
  target: z.object({
    /** « Avis de Grace M. », « Profil Saveurs de Dakar »… */
    label: z.string(),
    /** Le texte signalé (avis, message), s'il y en a un. */
    excerpt: z.string().optional(),
    /** Le compte à suspendre si l'admin choisit « suspendre le compte ». */
    ownerId: idSchema.optional(),
    /** Le contenu a déjà été masqué ou supprimé. */
    hidden: z.boolean(),
  }),
});
