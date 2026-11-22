import { mockDb } from '@afro/common/mocks';
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useSessionStore } from '@/stores/session';
import { server } from './server';

// Les machines de CI (GitHub Actions) sont plus lentes que nos postes : le premier
// affichage d'une page chargée à la demande (lazy) peut dépasser la seconde par défaut
// des « findBy… ». On laisse 5 secondes avant de déclarer l'élément introuvable.
configure({ asyncUtilTimeout: 5000 });

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
