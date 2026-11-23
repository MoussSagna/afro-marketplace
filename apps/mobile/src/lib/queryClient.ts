import { QueryClient } from '@tanstack/react-query';

/** Le cache des données serveur (mêmes réglages que le site). */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  });
}
