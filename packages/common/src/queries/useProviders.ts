import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ProviderSearchFilters } from '../types';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

/** Recherche de prestataires (P2, P4). Les anciens résultats restent affichés pendant le chargement des nouveaux. */
export function useProviderSearch(filters: ProviderSearchFilters) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.providers.search(filters),
    queryFn: () => api.searchProviders(filters),
    placeholderData: keepPreviousData,
  });
}

/** Le profil public d'un prestataire (P5). */
export function useProvider(slug: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.providers.detail(slug),
    queryFn: () => api.getProviderBySlug(slug),
    // Un slug vide = rien à charger (utile quand on attend une autre donnée).
    enabled: slug !== '',
  });
}

export function useProviderReviews(providerId: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.providers.reviews(providerId ?? ''),
    queryFn: () => api.listProviderReviews(providerId!),
    enabled: !!providerId,
  });
}

/** Les jours où le prestataire n'est pas disponible, entre deux dates (incluses). */
export function useUnavailableDates(
  providerId: string | undefined,
  range: { from: string; to: string },
) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.providers.unavailableDates(providerId ?? '', range),
    queryFn: () => api.listUnavailableDates(providerId!, range),
    enabled: !!providerId,
  });
}

export function useCulturalOrigins() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.culturalOrigins,
    queryFn: () => api.listCulturalOrigins(),
    staleTime: 60 * 60 * 1000,
  });
}
