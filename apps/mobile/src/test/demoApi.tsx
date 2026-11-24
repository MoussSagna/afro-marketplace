import { createHttpApiClient, type ApiClient } from '@afro/common';
import { createHandlers, createMockDb } from '@afro/common/mocks';
import { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createMockFetch } from '@/lib/api/mockFetch';
import { AppProviders } from '@/providers/AppProviders';
import { useSessionStore } from '@/stores/session';

/** Un client API branché sur une base de démo neuve (comme dans l'app), à date fixe. */
export function demoApi() {
  const db = createMockDb({ now: () => new Date('2026-11-23T10:00:00Z') });
  const api = createHttpApiClient({
    fetchFn: createMockFetch(createHandlers(db)),
    getToken: () => useSessionStore.getState().token,
  });
  return { db, api };
}

/** Les fournisseurs de l'app pour un test : pas de nouvel essai, pas de minuteur de nettoyage. */
export function testProviders(api: ApiClient) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders apiClient={api} queryClient={queryClient}>
        {children}
      </AppProviders>
    );
  };
}
