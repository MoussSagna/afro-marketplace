import type {
  AcceptQuoteInput,
  AdminOverview,
  AdminProviderDetails,
  AdminReport,
  Booking,
  BookingSummary,
  CancelBookingInput,
  Category,
  ConversationSummary,
  CreateQuoteInput,
  CreateQuoteRequestInput,
  CreateReportInput,
  CreateReviewInput,
  CulturalOrigin,
  DeclineQuoteRequestInput,
  DemoAccount,
  Media,
  MediaInput,
  Message,
  MyProviderDetails,
  ModerateProviderInput,
  Offering,
  OfferingInput,
  Paginated,
  ProviderCard,
  ProviderDashboard,
  ProviderDetails,
  ProviderProfile,
  ProviderSearchFilters,
  ProviderSearchResult,
  Quote,
  QuoteRequest,
  QuoteRequestDetails,
  QuoteRequestSummary,
  ReplyToReviewInput,
  Report,
  ReportStatus,
  ResolveReportInput,
  Review,
  ReviewWithAuthor,
  SendMessageInput,
  Session,
  SetUserStatusInput,
  Unavailability,
  UpdateMeInput,
  UpdateProviderProfileInput,
  User,
} from '../types';

/** De quel côté l'utilisateur regarde ses demandes et réservations (compte à deux rôles). */
export type Side = 'client' | 'provider';

/**
 * La liste de toutes les opérations que les écrans peuvent demander au serveur.
 *
 * Les écrans ne connaissent QUE cette interface. Aujourd'hui, elle est servie
 * par une implémentation HTTP qui parle à MSW (données mockées) ; demain, par
 * le vrai back-end (Supabase probablement), sans toucher aux écrans.
 *
 * Toutes les signatures du MVP sont là. Les handlers MSW correspondants
 * arrivent lot après lot (le numéro est indiqué à côté de chaque groupe).
 * L'utilisateur connecté est connu grâce au jeton de session : il n'apparaît
 * donc pas dans les paramètres.
 */
export interface ApiClient {
  // --- Session et compte (lots 2 et 9)
  listDemoAccounts(): Promise<DemoAccount[]>;
  signInAsDemo(userId: string): Promise<Session>;
  getMe(): Promise<User>;
  updateMe(input: UpdateMeInput): Promise<User>;
  /** Anonymise le compte (RGPD). */
  deleteMe(): Promise<void>;

  // --- Catalogue et recherche (lots 0 et 3)
  listCategories(): Promise<Category[]>;
  listCulturalOrigins(): Promise<CulturalOrigin[]>;
  listFeaturedProviders(): Promise<ProviderCard[]>;
  searchProviders(filters: ProviderSearchFilters): Promise<ProviderSearchResult>;
  getProviderBySlug(slug: string): Promise<ProviderDetails>;
  /** Les jours indisponibles d'un prestataire entre deux dates (incluses). */
  listUnavailableDates(providerId: string, range: { from: string; to: string }): Promise<string[]>;
  listProviderReviews(providerId: string): Promise<ReviewWithAuthor[]>;

  // --- Demandes de devis (lot 4)
  createQuoteRequest(input: CreateQuoteRequestInput): Promise<QuoteRequest>;
  listQuoteRequests(side: Side): Promise<QuoteRequestSummary[]>;
  getQuoteRequest(id: string): Promise<QuoteRequestDetails>;
  declineQuoteRequest(id: string, input: DeclineQuoteRequestInput): Promise<QuoteRequest>;
  cancelQuoteRequest(id: string): Promise<QuoteRequest>;

  // --- Messagerie (lot 4)
  listConversations(side: Side): Promise<ConversationSummary[]>;
  listMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, input: SendMessageInput): Promise<Message>;
  markConversationRead(conversationId: string): Promise<void>;

  // --- Devis et réservations (lot 5)
  createQuote(input: CreateQuoteInput): Promise<Quote>;
  /** Règle n° 5 : crée la réservation, bloque la date, remplace les autres versions. */
  acceptQuote(quoteId: string, input: AcceptQuoteInput): Promise<Booking>;
  declineQuote(quoteId: string): Promise<Quote>;
  listBookings(side: Side): Promise<BookingSummary[]>;
  cancelBooking(bookingId: string, input: CancelBookingInput): Promise<Booking>;
  getProviderDashboard(): Promise<ProviderDashboard>;
  /** Les dates bloquées du prestataire connecté (agenda S6). */
  listMyUnavailabilities(range: { from: string; to: string }): Promise<Unavailability[]>;
  blockDate(date: string): Promise<Unavailability>;
  unblockDate(unavailabilityId: string): Promise<void>;

  // --- Avis (lot 6)
  createReview(input: CreateReviewInput): Promise<Review>;
  replyToReview(reviewId: string, input: ReplyToReviewInput): Promise<Review>;
  /** S8 : les avis reçus par le prestataire connecté (masqués compris). */
  listMyReviews(): Promise<ReviewWithAuthor[]>;

  // --- Profil prestataire et onboarding (lot 7)
  getMyProviderProfile(): Promise<MyProviderDetails>;
  /** Crée le profil (et donne le rôle prestataire) s'il n'existe pas encore. */
  startProviderOnboarding(): Promise<ProviderProfile>;
  updateMyProviderProfile(input: UpdateProviderProfileInput): Promise<ProviderProfile>;
  /** Règle n° 2 : refusé tant que le profil est incomplet. */
  submitMyProviderProfile(): Promise<ProviderProfile>;
  setMyProviderProfilePaused(paused: boolean): Promise<ProviderProfile>;
  createOffering(input: OfferingInput): Promise<Offering>;
  updateOffering(offeringId: string, input: OfferingInput): Promise<Offering>;
  deleteOffering(offeringId: string): Promise<void>;
  addMedia(input: MediaInput): Promise<Media>;
  deleteMedia(mediaId: string): Promise<void>;

  // --- Signalements (lots 4 et 6)
  createReport(input: CreateReportInput): Promise<Report>;

  // --- Administration (lot 8)
  getAdminOverview(): Promise<AdminOverview>;
  /** A2 : les profils en attente de validation, les plus anciens d'abord. */
  listProvidersToReview(): Promise<ProviderProfile[]>;
  getAdminProvider(providerId: string): Promise<AdminProviderDetails>;
  moderateProvider(providerId: string, input: ModerateProviderInput): Promise<ProviderProfile>;
  listReports(status?: ReportStatus): Promise<AdminReport[]>;
  resolveReport(reportId: string, input: ResolveReportInput): Promise<Report>;
  listUsers(query: { q?: string; page?: number }): Promise<Paginated<User>>;
  setUserStatus(userId: string, input: SetUserStatusInput): Promise<User>;
}

/** Erreur renvoyée quand le serveur répond avec un statut d'échec. */
export class ApiError extends Error {
  readonly status: number;
  /** Code stable renvoyé par le serveur (ex. « provider_unavailable »), s'il y en a un. */
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
