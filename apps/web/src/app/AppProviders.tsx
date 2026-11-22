import { ApiClientProvider, createHttpApiClient, type ApiClient } from '@afro/common';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { createQueryClient } from '@/lib/queryClient';

const defaultApiClient = createHttpApiClient();

interface AppProvidersProps {
  children: ReactNode;
  /** Remplaçables dans les tests. */
  apiClient?: ApiClient;
  queryClient?: QueryClient;
}

/** Tout ce dont l'application a besoin autour des pages : données, API, animations. */
export function AppProviders({
  children,
  apiClient = defaultApiClient,
  queryClient,
}: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ApiClientProvider client={apiClient}>
        {/* reducedMotion="user" : les animations respectent le réglage « réduire les animations » du système. */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </ApiClientProvider>
    </QueryClientProvider>
  );
}
