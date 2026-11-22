import { useQuery } from '@tanstack/react-query';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

/** Prestataires mis en avant sur la page d'accueil. */
export function useFeaturedProviders() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.providers.featured(),
    queryFn: () => api.listFeaturedProviders(),
  });
}
