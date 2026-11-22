import { handlers, mockDb } from '@afro/common/mocks';
import { setupWorker } from 'msw/browser';

// Les données mockées survivent au rechargement de la page (localStorage).
// Pour repartir de zéro : menu du compte → « Réinitialiser les données de démo ».
mockDb.enablePersistence(window.localStorage);

// Le « faux serveur » côté navigateur : un Service Worker intercepte les appels /api.
export const worker = setupWorker(...handlers);
