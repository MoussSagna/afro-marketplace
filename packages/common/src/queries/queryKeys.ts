import type { Side } from '../api';
import type { ProviderSearchFilters, ReportStatus } from '../types';

/**
 * Les « clés de cache » de TanStack Query, rangées au même endroit.
 * Après une modification (ex. accepter un devis), on invalide une clé
 * et TanStack Query recharge tout seul les écrans concernés.
 */
export const queryKeys = {
  auth: {
    demoAccounts: ['auth', 'demo-accounts'] as const,
    me: ['auth', 'me'] as const,
  },
  categories: ['categories'] as const,
  culturalOrigins: ['cultural-origins'] as const,
  providers: {
    all: ['providers'] as const,
    featured: () => [...queryKeys.providers.all, 'featured'] as const,
    search: (filters: ProviderSearchFilters) =>
      [...queryKeys.providers.all, 'search', filters] as const,
    /** La même recherche, chargée page après page (liste qui défile, sur mobile). */
    searchPages: (filters: ProviderSearchFilters) =>
      [...queryKeys.providers.all, 'search-pages', filters] as const,
    detail: (slug: string) => [...queryKeys.providers.all, 'detail', slug] as const,
    reviews: (providerId: string) => [...queryKeys.providers.all, 'reviews', providerId] as const,
    unavailableDates: (providerId: string, range: { from: string; to: string }) =>
      [...queryKeys.providers.all, 'unavailable-dates', providerId, range] as const,
  },
  quoteRequests: {
    all: ['quote-requests'] as const,
    list: (side: Side) => [...queryKeys.quoteRequests.all, 'list', side] as const,
    detail: (id: string) => [...queryKeys.quoteRequests.all, 'detail', id] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    list: (side: Side) => [...queryKeys.conversations.all, 'list', side] as const,
    messages: (conversationId: string) =>
      [...queryKeys.conversations.all, 'messages', conversationId] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    list: (side: Side) => [...queryKeys.bookings.all, 'list', side] as const,
  },
  myProvider: {
    all: ['my-provider'] as const,
    profile: () => [...queryKeys.myProvider.all, 'profile'] as const,
    dashboard: () => [...queryKeys.myProvider.all, 'dashboard'] as const,
    reviews: () => [...queryKeys.myProvider.all, 'reviews'] as const,
    unavailabilities: (range: { from: string; to: string }) =>
      [...queryKeys.myProvider.all, 'unavailabilities', range] as const,
  },
  admin: {
    all: ['admin'] as const,
    overview: () => [...queryKeys.admin.all, 'overview'] as const,
    providersToReview: () => [...queryKeys.admin.all, 'providers-to-review'] as const,
    provider: (id: string) => [...queryKeys.admin.all, 'provider', id] as const,
    reports: (status?: ReportStatus) =>
      [...queryKeys.admin.all, 'reports', status ?? 'all'] as const,
    users: (query: { q?: string; page?: number }) =>
      [...queryKeys.admin.all, 'users', query] as const,
  },
};
