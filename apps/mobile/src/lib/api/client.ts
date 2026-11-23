// Avant msw : les API web qui manquent au téléphone (voir lib/polyfills).
import '@/lib/polyfills';
import { createHttpApiClient } from '@afro/common';
import { handlers } from '@afro/common/mocks';
import { useSessionStore } from '@/stores/session';
import { createMockFetch } from './mockFetch';

/**
 * Le client API de l'app : le MÊME que celui du site (`createHttpApiClient`),
 * seul le `fetch` change. Ici il répond avec les données de démo, en mémoire.
 * Chaque appel envoie le jeton de la session en cours (lu au moment de l'appel).
 */
export const apiClient = createHttpApiClient({
  fetchFn: createMockFetch(handlers),
  getToken: () => useSessionStore.getState().token,
});
