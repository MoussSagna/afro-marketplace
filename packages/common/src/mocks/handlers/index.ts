import type { MockDb } from '../db';
import { authHandlers } from './auth';
import { catalogueHandlers } from './catalogue';
import { messagingHandlers } from './messaging';
import { providerHandlers } from './providers';
import { quoteRequestHandlers } from './quoteRequests';

export * from './http';
export { FEATURED_PROVIDERS_COUNT } from './catalogue';

/**
 * Tous les « faux serveurs » MSW, branchés sur une base mockée.
 * Les mêmes handlers servent dans le navigateur (dev), dans les tests Vitest
 * (Node) et plus tard dans l'app mobile.
 *
 * Un fichier par ressource ; chaque lot ajoute les siens.
 */
export function createHandlers(db: MockDb) {
  // L'ordre compte : catalogue (« /providers/featured ») avant providers (« /providers/:slug »).
  return [
    ...authHandlers(db),
    ...catalogueHandlers(db),
    ...providerHandlers(db),
    ...quoteRequestHandlers(db),
    ...messagingHandlers(db),
  ];
}
