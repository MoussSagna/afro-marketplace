import type { ProviderSearchFilters } from '../types';

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
    detail: (slug: string) => [...queryKeys.providers.all, 'detail', slug] as const,
    reviews: (providerId: string) => [...queryKeys.providers.all, 'reviews', providerId] as const,
    unavailableDates: (providerId: string, range: { from: string; to: string }) =>
      [...queryKeys.providers.all, 'unavailable-dates', providerId, range] as const,
  },
};
