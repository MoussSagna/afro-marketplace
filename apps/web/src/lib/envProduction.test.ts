import { loadEnv } from 'vite';
import { describe, expect, it } from 'vitest';

/**
 * Le site en ligne (Vercel) est construit en mode « production ».
 * Tant que le back-end n'existe pas, il doit embarquer les données fictives (MSW),
 * sinon les pages s'affichent vides.
 * `loadEnv` lit les fichiers .env exactement comme Vite le fait pendant `vite build`.
 */
describe('variables du build de production', () => {
  it('active les données fictives tant que le back-end n’existe pas', () => {
    const appDir = decodeURIComponent(
      import.meta.url.replace('file://', '').replace(/src\/lib\/[^/]+$/, ''),
    );
    const env = loadEnv('production', appDir, 'VITE_');
    expect(env.VITE_USE_MOCKS).toBe('true');
  });
});
