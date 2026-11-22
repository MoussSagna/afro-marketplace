/**
 * SEO : le plan du site (sitemap.xml), le robots.txt et les données structurées (JSON-LD).
 * Fonctions pures : testées en unitaire, appelées par le plugin Vite (`vite-plugins/seo.ts`)
 * au moment du build et par la page profil prestataire.
 */

/** Les pages publiques fixes, toujours dans le plan du site. */
export const STATIC_PATHS = [
  '/',
  '/recherche',
  '/comment-ca-marche',
  '/devenir-prestataire',
  '/faq',
  '/cgu',
  '/mentions-legales',
  '/confidentialite',
] as const;

/** Les espaces privés : jamais indexés. */
export const PRIVATE_PATHS = [
  '/espace/',
  '/pro/',
  '/admin/',
  '/connexion',
  '/deconnexion',
] as const;

export interface SitemapInput {
  categories: { slug: string }[];
  /** Seuls les profils publiés sont dans le plan du site. */
  providers: { slug: string; status: string; updatedAt: string }[];
}

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const trimSlash = (url: string) => url.replace(/\/+$/, '');

export function buildSitemap(siteUrl: string, { categories, providers }: SitemapInput): string {
  const base = trimSlash(siteUrl);
  const entries = [
    ...STATIC_PATHS.map((path) => ({ path, lastmod: undefined as string | undefined })),
    ...categories.map((c) => ({ path: `/categories/${c.slug}`, lastmod: undefined })),
    ...providers
      .filter((p) => p.status === 'published')
      .map((p) => ({ path: `/prestataires/${p.slug}`, lastmod: p.updatedAt.slice(0, 10) })),
  ];
  const urls = entries.map(
    ({ path, lastmod }) =>
      `  <url><loc>${escapeXml(base + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

export function buildRobotsTxt(siteUrl: string, { allowIndexing }: { allowIndexing: boolean }) {
  // Une préview ou une version de démo ne doit pas finir dans Google.
  if (!allowIndexing) return 'User-agent: *\nDisallow: /\n';
  return [
    'User-agent: *',
    ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${trimSlash(siteUrl)}/sitemap.xml`,
    '',
  ].join('\n');
}

export interface ProviderJsonLdInput {
  displayName: string;
  slug: string;
  bio: string;
  city: string;
  coverUrl?: string;
  categoryNames: string[];
  priceFrom?: number;
  ratingAverage?: number;
  ratingCount: number;
}

/**
 * Les données structurées schema.org d'un profil : Google peut afficher la note,
 * la ville et le prix dans ses résultats. Un prix en centimes devient des euros.
 */
export function buildProviderJsonLd(siteUrl: string, p: ProviderJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: p.displayName,
    url: `${trimSlash(siteUrl)}/prestataires/${p.slug}`,
    description: p.bio.slice(0, 300),
    ...(p.coverUrl && { image: p.coverUrl }),
    address: { '@type': 'PostalAddress', addressLocality: p.city, addressCountry: 'FR' },
    ...(p.categoryNames.length > 0 && { knowsAbout: p.categoryNames }),
    ...(p.priceFrom !== undefined && { priceRange: `À partir de ${p.priceFrom / 100} €` }),
    // Google ignore une note sans avis : on ne la donne que s'il y en a.
    ...(p.ratingAverage !== undefined &&
      p.ratingCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: p.ratingAverage,
          reviewCount: p.ratingCount,
          bestRating: 5,
          worstRating: 1,
        },
      }),
  };
}
