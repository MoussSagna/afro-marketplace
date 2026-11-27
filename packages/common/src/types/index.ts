import type { z } from 'zod';
import type * as s from '../schemas';

/*
 * Les types sont DÉDUITS des schémas Zod : on n'écrit jamais deux fois la même chose.
 * Si tu ajoutes un champ dans un schéma, le type suit tout seul.
 *
 * - z.infer  : la donnée APRÈS validation (ce que reçoit le code).
 * - z.input  : la donnée AVANT validation (ce que saisit un formulaire). Utile
 *              quand le schéma transforme la valeur (ex. le SIRET dont on retire les espaces).
 */

// Comptes
export type UserRole = z.infer<typeof s.userRoleSchema>;
export type UserStatus = z.infer<typeof s.userStatusSchema>;
export type AuthProvider = z.infer<typeof s.authProviderSchema>;
export type NotificationPrefs = z.infer<typeof s.notificationPrefsSchema>;
export type User = z.infer<typeof s.userSchema>;
export type PublicUser = z.infer<typeof s.publicUserSchema>;
export type DemoAccount = z.infer<typeof s.demoAccountSchema>;
export type Session = z.infer<typeof s.sessionSchema>;

// Connexion et inscription (simulées jusqu'au back-end)
export type OtpPurpose = z.infer<typeof s.otpPurposeSchema>;
export type SignUpInput = z.input<typeof s.signUpInputSchema>;
export type SignUpResult = z.infer<typeof s.signUpResultSchema>;
export type VerifyOtpInput = z.input<typeof s.verifyOtpInputSchema>;
export type ResendOtpInput = z.input<typeof s.resendOtpInputSchema>;
export type SignInInput = z.input<typeof s.signInInputSchema>;
export type ForgotPasswordInput = z.input<typeof s.forgotPasswordInputSchema>;
export type ResetPasswordInput = z.input<typeof s.resetPasswordInputSchema>;
export type ChangePasswordInput = z.input<typeof s.changePasswordInputSchema>;

export type ProviderStatus = z.infer<typeof s.providerStatusSchema>;
export type LegalType = z.infer<typeof s.legalTypeSchema>;
export type CancellationPolicy = z.infer<typeof s.cancellationPolicySchema>;
export type ProviderProfile = z.infer<typeof s.providerProfileSchema>;
export type PublicProviderProfile = z.infer<typeof s.publicProviderProfileSchema>;
export type ProviderCard = z.infer<typeof s.providerCardSchema>;

// Catalogue
export type Category = z.infer<typeof s.categorySchema>;
export type CulturalOrigin = z.infer<typeof s.culturalOriginSchema>;
export type PricingType = z.infer<typeof s.pricingTypeSchema>;
export type Offering = z.infer<typeof s.offeringSchema>;
export type Media = z.infer<typeof s.mediaSchema>;
export type Unavailability = z.infer<typeof s.unavailabilitySchema>;
export type ProviderSort = z.infer<typeof s.providerSortSchema>;
export type ProviderSearchFilters = z.infer<typeof s.providerSearchFiltersSchema>;

// Transaction
export type EventType = z.infer<typeof s.eventTypeSchema>;
export type ClientType = z.infer<typeof s.clientTypeSchema>;
export type QuoteRequestStatus = z.infer<typeof s.quoteRequestStatusSchema>;
export type QuoteRequest = z.infer<typeof s.quoteRequestSchema>;
export type QuoteStatus = z.infer<typeof s.quoteStatusSchema>;
export type QuoteLine = z.infer<typeof s.quoteLineSchema>;
export type Quote = z.infer<typeof s.quoteSchema>;
export type BookingStatus = z.infer<typeof s.bookingStatusSchema>;
export type PaymentMode = z.infer<typeof s.paymentModeSchema>;
export type CancelledBy = z.infer<typeof s.cancelledBySchema>;
export type Booking = z.infer<typeof s.bookingSchema>;

// Échanges
export type Conversation = z.infer<typeof s.conversationSchema>;
export type MessageKind = z.infer<typeof s.messageKindSchema>;
export type Message = z.infer<typeof s.messageSchema>;
export type Review = z.infer<typeof s.reviewSchema>;
export type ReviewStatus = z.infer<typeof s.reviewStatusSchema>;

// Modération
export type ReportTargetType = z.infer<typeof s.reportTargetTypeSchema>;
export type ReportReason = z.infer<typeof s.reportReasonSchema>;
export type ReportStatus = z.infer<typeof s.reportStatusSchema>;
export type Report = z.infer<typeof s.reportSchema>;
export type ModerationActionType = z.infer<typeof s.moderationActionTypeSchema>;
export type ModerationAction = z.infer<typeof s.moderationActionSchema>;

// Formulaires (données saisies, avant validation)
export type UpdateMeInput = z.input<typeof s.updateMeInputSchema>;
export type UpdateProviderProfileInput = z.input<typeof s.updateProviderProfileInputSchema>;
export type ModerateProviderInput = z.input<typeof s.moderateProviderInputSchema>;
export type OfferingInput = z.input<typeof s.offeringInputSchema>;
export type MediaInput = z.input<typeof s.mediaInputSchema>;
export type CreateQuoteRequestInput = z.input<typeof s.createQuoteRequestInputSchema>;
export type DeclineQuoteRequestInput = z.input<typeof s.declineQuoteRequestInputSchema>;
export type CreateQuoteInput = z.input<typeof s.createQuoteInputSchema>;
export type QuoteLineInput = z.input<typeof s.quoteLineInputSchema>;
export type AcceptQuoteInput = z.input<typeof s.acceptQuoteInputSchema>;
export type CancelBookingInput = z.input<typeof s.cancelBookingInputSchema>;
export type SendMessageInput = z.input<typeof s.sendMessageInputSchema>;
export type CreateReviewInput = z.input<typeof s.createReviewInputSchema>;
export type ReplyToReviewInput = z.input<typeof s.replyToReviewInputSchema>;
export type CreateReportInput = z.input<typeof s.createReportInputSchema>;
export type ResolveReportInput = z.input<typeof s.resolveReportInputSchema>;
export type SetUserStatusInput = z.input<typeof s.setUserStatusInputSchema>;

// Vues renvoyées par l'API
export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number };
export type ProviderSearchResult = z.infer<typeof s.providerSearchResultSchema>;
export type ProviderDetails = z.infer<typeof s.providerDetailsSchema>;
export type MyProviderDetails = z.infer<typeof s.myProviderDetailsSchema>;
export type AdminOverview = z.infer<typeof s.adminOverviewSchema>;
export type EventSummary = z.infer<typeof s.eventSummarySchema>;
export type EventDetails = z.infer<typeof s.eventDetailsSchema>;
export type AdminActivityItem = z.infer<typeof s.adminActivityItemSchema>;
export type AdminProviderDetails = z.infer<typeof s.adminProviderDetailsSchema>;
export type AdminReport = z.infer<typeof s.adminReportSchema>;
export type ReviewWithAuthor = z.infer<typeof s.reviewWithAuthorSchema>;
export type QuoteRequestSummary = z.infer<typeof s.quoteRequestSummarySchema>;
export type QuoteRequestDetails = z.infer<typeof s.quoteRequestDetailsSchema>;
export type ConversationSummary = z.infer<typeof s.conversationSummarySchema>;
export type BookingSummary = z.infer<typeof s.bookingSummarySchema>;
export type ProviderDashboard = z.infer<typeof s.providerDashboardSchema>;

// Événements (planificateur)
export type PlannedEventType = z.infer<typeof s.plannedEventTypeSchema>;
export type EventBudget = z.infer<typeof s.eventBudgetSchema>;
export type PlannedEvent = z.infer<typeof s.eventSchema>;
export type EventProvider = z.infer<typeof s.eventProviderSchema>;
export type EventProviderStatus = z.infer<typeof s.eventProviderStatusSchema>;
export type EventStatus = z.infer<typeof s.eventStatusSchema>;
export type EventCounts = z.infer<typeof s.eventCountsSchema>;
export type EventInput = z.input<typeof s.eventInputSchema>;
export type RequestEventQuotesInput = z.input<typeof s.requestEventQuotesInputSchema>;
export type RequestEventQuotesResult = z.infer<typeof s.requestEventQuotesResultSchema>;
