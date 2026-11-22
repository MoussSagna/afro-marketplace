import { mockDb } from '@afro/common/mocks';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useSessionStore } from '@/stores/session';
import { server } from './server';

// MSW côté Node : mêmes handlers que dans le navigateur.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers(); // annule les surcharges faites dans un test (server.use)
  mockDb.reset(); // chaque test repart des données de démo
  useSessionStore.getState().signOut(); // et sans personne de connecté
  localStorage.clear();
});
afterAll(() => server.close());
