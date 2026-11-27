import { mockDb } from '@afro/common/mocks';
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useResultsView } from '@/features/search/lib/resultsView';
import { useSearchDraft } from '@/features/search/lib/searchDraft';
import { useFavoritesStore } from '@/stores/favorites';
import { useSessionStore } from '@/stores/session';
import { routes } from '@/app/routes';
import { preloadLazyRoutes } from './preloadRoutes';
import { server } from './server';

// Les machines de CI (GitHub Actions) sont plus lentes que nos postes : le premier
// affichage d'une page chargée à la demande (lazy) peut dépasser la seconde par défaut
// des « findBy… ». On laisse 5 secondes avant de déclarer l'élément introuvable.
configure({ asyncUtilTimeout: 5000 });

// jsdom n'a pas de défilement : `window.scrollTo` (appelé par `RootRoute` à chaque changement de page)
// affiche « Not implemented ». Un faux silencieux suffit ; un test peut l'espionner avec `vi.spyOn`.
window.scrollTo = (() => {}) as typeof window.scrollTo;

// jsdom n'a pas d'IntersectionObserver, utilisé par `whileInView` de Motion (apparitions au défilement).
// Ce faux annonce tout de suite chaque élément comme visible : l'animation se joue et le contenu s'affiche.
class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ target, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver ??=
  IntersectionObserverStub as unknown as typeof IntersectionObserver;

// MSW côté Node : mêmes handlers que dans le navigateur.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// Les pages chargées à la demande (lazy) sont chargées une fois ici, avant les tests du fichier :
// une navigation ne dépend plus de la vitesse de la machine (voir preloadRoutes.ts).
beforeAll(() => preloadLazyRoutes(routes));
afterEach(() => {
  cleanup();
  server.resetHandlers(); // annule les surcharges faites dans un test (server.use)
  mockDb.reset(); // chaque test repart des données de démo
  useSessionStore.getState().signOut(); // et sans personne de connecté
  localStorage.clear();
  useSearchDraft.getState().reset(); // la recherche guidée repart vide
  useFavoritesStore.getState().clear(); // aucun favori
  useResultsView.getState().setView('grid'); // résultats en grille (vue par défaut)
});
afterAll(() => server.close());
