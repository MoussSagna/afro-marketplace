import { createContext, useContext, type ReactNode } from 'react';
import type { ApiClient } from '../api';

const ApiClientContext = createContext<ApiClient | null>(null);

/** Rend l'ApiClient disponible pour tous les hooks de données de l'application. */
export function ApiClientProvider({
  client,
  children,
}: {
  client: ApiClient;
  children: ReactNode;
}) {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient doit être utilisé à l’intérieur de <ApiClientProvider>.');
  }
  return client;
}
