import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type * as CommonMocks from '@afro/common/mocks';
import { runnerImport, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { buildRobotsTxt, buildSitemap } from './src/lib/seo.ts';

/**
 * SEO : génère sitemap.xml et robots.txt au build.
 * - L'adresse du site vient de SITE_URL, sinon de Vercel (domaine de production).
 * - Seule la production est indexable : une préview Vercel répond « Disallow: / ».
 * - Au MVP mocké, le plan du site est tiré du seed ; au lot 10, il viendra de Supabase.
 */
function seoFiles(): Plugin {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl =
    process.env.SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:5173');
  const allowIndexing = process.env.VERCEL_ENV === 'production';
  return {
    name: 'wenzee-seo-files',
    apply: 'build',
    async generateBundle() {
      // Le paquet commun est en TypeScript : Vite le charge pour nous (runnerImport).
      const { module } = await runnerImport<typeof CommonMocks>('@afro/common/mocks');
      const seed = module.buildSeed(new Date());
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: buildSitemap(siteUrl, seed),
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: buildRobotsTxt(siteUrl, { allowIndexing }),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoFiles()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    // Un test peut enchaîner plusieurs attentes de 5 s (voir src/test/setup.ts).
    testTimeout: 20000,
    // Le beforeAll de src/test/setup.ts charge toutes les pages (preloadRoutes.ts) : plus long sur la CI.
    hookTimeout: 60000,
  },
});
