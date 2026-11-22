import { z } from 'zod';
import {
  adminOverviewSchema,
  adminProviderDetailsSchema,
  adminReportSchema,
  apiErrorBodySchema,
  bookingSchema,
  bookingSummarySchema,
  categorySchema,
  conversationSummarySchema,
  culturalOriginSchema,
  demoAccountSchema,
  isoDateSchema,
  mediaSchema,
  messageSchema,
  myProviderDetailsSchema,
  offeringSchema,
  paginated,
  providerCardSchema,
  providerDashboardSchema,
  providerDetailsSchema,
  providerProfileSchema,
  providerSearchResultSchema,
  quoteRequestDetailsSchema,
  quoteRequestSchema,
  quoteRequestSummarySchema,
  quoteSchema,
  reportSchema,
  reviewSchema,
  reviewWithAuthorSchema,
  sessionSchema,
  unavailabilitySchema,
  userSchema,
} from '../schemas';
import type { ProviderSearchFilters } from '../types';
import { ApiError, type ApiClient } from './ApiClient';

export interface HttpApiClientOptions {
  /** Préfixe des routes de l'API, « /api » par défaut. */
  baseUrl?: string;
  /** Permet de remplacer fetch (tests, mobile…). */
  fetchFn?: typeof fetch;
  /** Renvoie le jeton de la session en cours (ou null si personne n'est connecté). */
  getToken?: () => string | null;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
type Query = Record<string, string | number | boolean | string[] | undefined>;

/** Transforme { origins: ['senegal', 'mali'], page: 2 } en « ?origins=senegal,mali&page=2 ». */
export function toQueryString(query: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      continue;
    }
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

const noContent = z.unknown().transform(() => undefined);

/**
 * Implémentation de l'ApiClient qui fait de vrais appels HTTP.
 * Chaque réponse est validée avec Zod : si le serveur renvoie des données
 * inattendues, on le voit tout de suite au lieu d'avoir un bug plus loin.
 */
export function createHttpApiClient(options: HttpApiClientOptions = {}): ApiClient {
  const { baseUrl = '/api', fetchFn = (...args) => fetch(...args), getToken } = options;

  async function request<T>(
    method: Method,
    path: string,
    schema: z.ZodType<T>,
    body?: unknown,
  ): Promise<T> {
    // On construit une URL absolue : nécessaire en dehors du navigateur (tests Node, mobile).
    const url = new URL(`${baseUrl}${path}`, globalThis.location?.origin ?? 'http://localhost');
    const headers = new Headers();
    const token = getToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (body !== undefined) headers.set('Content-Type', 'application/json');

    const response = await fetchFn(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      // Le serveur explique l'erreur avec { code, message } : on le garde pour l'afficher.
      const details = apiErrorBodySchema.safeParse(await response.json().catch(() => null));
      throw new ApiError(
        response.status,
        details.success ? details.data.message : `${method} ${path} a échoué (${response.status})`,
        details.success ? details.data.code : undefined,
      );
    }
    if (response.status === 204) return schema.parse(undefined);
    return schema.parse(await response.json());
  }

  const get = <T>(path: string, schema: z.ZodType<T>) => request('GET', path, schema);
  const id = encodeURIComponent;

  return {
    // Session et compte
    listDemoAccounts: () => get('/auth/demo-accounts', z.array(demoAccountSchema)),
    signInAsDemo: (userId) => request('POST', '/auth/demo-sign-in', sessionSchema, { userId }),
    getMe: () => get('/me', userSchema),
    updateMe: (input) => request('PATCH', '/me', userSchema, input),
    deleteMe: () => request('DELETE', '/me', noContent),

    // Catalogue et recherche
    listCategories: () => get('/categories', z.array(categorySchema)),
    listCulturalOrigins: () => get('/cultural-origins', z.array(culturalOriginSchema)),
    listFeaturedProviders: () => get('/providers/featured', z.array(providerCardSchema)),
    searchProviders: (filters: ProviderSearchFilters) =>
      get(`/providers${toQueryString(filters)}`, providerSearchResultSchema),
    getProviderBySlug: (slug) => get(`/providers/${id(slug)}`, providerDetailsSchema),
    listUnavailableDates: (providerId, range) =>
      get(
        `/providers/${id(providerId)}/unavailable-dates${toQueryString(range)}`,
        z.array(isoDateSchema),
      ),
    listProviderReviews: (providerId) =>
      get(`/providers/${id(providerId)}/reviews`, z.array(reviewWithAuthorSchema)),

    // Demandes de devis
    createQuoteRequest: (input) => request('POST', '/quote-requests', quoteRequestSchema, input),
    listQuoteRequests: (side) =>
      get(`/quote-requests${toQueryString({ side })}`, z.array(quoteRequestSummarySchema)),
    getQuoteRequest: (requestId) =>
      get(`/quote-requests/${id(requestId)}`, quoteRequestDetailsSchema),
    declineQuoteRequest: (requestId, input) =>
      request('POST', `/quote-requests/${id(requestId)}/decline`, quoteRequestSchema, input),
    cancelQuoteRequest: (requestId) =>
      request('POST', `/quote-requests/${id(requestId)}/cancel`, quoteRequestSchema),

    // Messagerie
    listConversations: (side) =>
      get(`/conversations${toQueryString({ side })}`, z.array(conversationSummarySchema)),
    listMessages: (conversationId) =>
      get(`/conversations/${id(conversationId)}/messages`, z.array(messageSchema)),
    sendMessage: (conversationId, input) =>
      request('POST', `/conversations/${id(conversationId)}/messages`, messageSchema, input),
    markConversationRead: (conversationId) =>
      request('POST', `/conversations/${id(conversationId)}/read`, noContent),

    // Devis et réservations
    createQuote: (input) => request('POST', '/quotes', quoteSchema, input),
    acceptQuote: (quoteId, input) =>
      request('POST', `/quotes/${id(quoteId)}/accept`, bookingSchema, input),
    declineQuote: (quoteId) => request('POST', `/quotes/${id(quoteId)}/decline`, quoteSchema),
    listBookings: (side) =>
      get(`/bookings${toQueryString({ side })}`, z.array(bookingSummarySchema)),
    cancelBooking: (bookingId, input) =>
      request('POST', `/bookings/${id(bookingId)}/cancel`, bookingSchema, input),
    getProviderDashboard: () => get('/me/provider/dashboard', providerDashboardSchema),
    listMyUnavailabilities: (range) =>
      get(`/me/provider/unavailabilities${toQueryString(range)}`, z.array(unavailabilitySchema)),
    blockDate: (date) =>
      request('POST', '/me/provider/unavailabilities', unavailabilitySchema, { date }),
    unblockDate: (unavailabilityId) =>
      request('DELETE', `/me/provider/unavailabilities/${id(unavailabilityId)}`, noContent),

    // Avis
    createReview: (input) => request('POST', '/reviews', reviewSchema, input),
    replyToReview: (reviewId, input) =>
      request('POST', `/reviews/${id(reviewId)}/reply`, reviewSchema, input),
    listMyReviews: () => get('/me/provider/reviews', z.array(reviewWithAuthorSchema)),

    // Profil prestataire et onboarding
    getMyProviderProfile: () => get('/me/provider', myProviderDetailsSchema),
    startProviderOnboarding: () => request('POST', '/me/provider', providerProfileSchema),
    updateMyProviderProfile: (input) =>
      request('PATCH', '/me/provider', providerProfileSchema, input),
    submitMyProviderProfile: () => request('POST', '/me/provider/submit', providerProfileSchema),
    setMyProviderProfilePaused: (paused) =>
      request('POST', '/me/provider/pause', providerProfileSchema, { paused }),
    createOffering: (input) => request('POST', '/me/provider/offerings', offeringSchema, input),
    updateOffering: (offeringId, input) =>
      request('PUT', `/me/provider/offerings/${id(offeringId)}`, offeringSchema, input),
    deleteOffering: (offeringId) =>
      request('DELETE', `/me/provider/offerings/${id(offeringId)}`, noContent),
    addMedia: (input) => request('POST', '/me/provider/media', mediaSchema, input),
    deleteMedia: (mediaId) => request('DELETE', `/me/provider/media/${id(mediaId)}`, noContent),

    // Signalements
    createReport: (input) => request('POST', '/reports', reportSchema, input),

    // Administration
    getAdminOverview: () => get('/admin/overview', adminOverviewSchema),
    listProvidersToReview: () => get('/admin/providers/to-review', z.array(providerProfileSchema)),
    getAdminProvider: (providerId) =>
      get(`/admin/providers/${id(providerId)}`, adminProviderDetailsSchema),
    moderateProvider: (providerId, input) =>
      request('POST', `/admin/providers/${id(providerId)}/moderate`, providerProfileSchema, input),
    listReports: (status) =>
      get(`/admin/reports${toQueryString({ status })}`, z.array(adminReportSchema)),
    resolveReport: (reportId, input) =>
      request('POST', `/admin/reports/${id(reportId)}/resolve`, reportSchema, input),
    listUsers: (query) => get(`/admin/users${toQueryString(query)}`, paginated(userSchema)),
    setUserStatus: (userId, input) =>
      request('POST', `/admin/users/${id(userId)}/status`, userSchema, input),
  };
}
