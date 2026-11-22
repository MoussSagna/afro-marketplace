import { useQuery } from '@tanstack/react-query';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

export function useCategories() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api.listCategories(),
    // Les catégories changent rarement : inutile de les recharger souvent.
    staleTime: 60 * 60 * 1000,
  });
}
