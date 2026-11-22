import { handlers } from '@afro/common/mocks';
import { setupWorker } from 'msw/browser';

// Le « faux serveur » côté navigateur : un Service Worker intercepte les appels /api.
export const worker = setupWorker(...handlers);
