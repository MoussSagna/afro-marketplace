import { handlers, mockDb } from '@afro/common/mocks';
import { setupWorker } from 'msw/browser';

// Les données mockées survivent au rechargement de la page (localStorage).
// Pour repartir de zéro : mockDb.reset() (un bouton arrivera au lot 2).
mockDb.enablePersistence(window.localStorage);

// Le « faux serveur » côté navigateur : un Service Worker intercepte les appels /api.
export const worker = setupWorker(...handlers);
