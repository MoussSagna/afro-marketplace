import { ApiClientProvider, type ApiClient } from '@afro/common';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { apiClient as defaultApiClient } from '@/lib/api/client';
import { createQueryClient } from '@/lib/queryClient';
import { ThemeRoot } from '@/theme/ThemeRoot';

interface AppProvidersProps {
  children: ReactNode;
  /** Remplaçables dans les tests. */
  apiClient?: ApiClient;
  queryClient?: QueryClient;
}

/**
 * Tout ce dont les écrans ont besoin autour d'eux (comme AppProviders sur le site) :
 * le cache TanStack Query et le client API lu par les hooks de `common`
 * (useCategories, useFeaturedProviders…), et les couleurs du thème clair ou sombre (ThemeRoot).
 */
export function AppProviders({
  children,
  apiClient = defaultApiClient,
  queryClient,
}: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <ApiClientProvider client={apiClient}>
        <ThemeRoot>{children}</ThemeRoot>
      </ApiClientProvider>
    </QueryClientProvider>
  );
}
