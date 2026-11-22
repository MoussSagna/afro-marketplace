import type { MockDb } from '../db';
import { catalogueHandlers } from './catalogue';

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
  return [...catalogueHandlers(db)];
}
