import { createMockDb } from './db';
import { createHandlers } from './handlers';

export * from './data';
export * from './db';
export * from './handlers';
export * from './conversations';
export * from './mappers';
export * from './search';
export * from './seed';

/**
 * La base mockée partagée par l'application (navigateur et tests).
 * Dans le navigateur, apps/web la rend persistante avec le localStorage.
 * Dans les tests, on appelle `mockDb.reset()` entre deux tests.
 */
export const mockDb = createMockDb();

/** Les handlers MSW branchés sur `mockDb`. */
export const handlers = createHandlers(mockDb);
