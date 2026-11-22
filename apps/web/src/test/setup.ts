import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

// MSW côté Node : mêmes handlers que dans le navigateur.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers(); // annule les surcharges faites dans un test (server.use)
});
afterAll(() => server.close());
