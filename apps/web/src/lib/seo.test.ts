import { describe, expect, it } from 'vitest';
import { buildProviderJsonLd, buildRobotsTxt, buildSitemap } from './seo';

describe('buildSitemap', () => {
  const xml = buildSitemap('https://wenzee.example/', {
    categories: [{ slug: 'traiteurs' }],
    providers: [
      { slug: 'saveurs-de-dakar', status: 'published', updatedAt: '2026-11-02T10:00:00.000Z' },
      { slug: 'brouillon', status: 'draft', updatedAt: '2026-11-02T10:00:00.000Z' },
    ],
  });

  it('liste les pages fixes, les catégories et les profils publiés seulement', () => {
    expect(xml).toContain('<loc>https://wenzee.example/</loc>');
    expect(xml).toContain('<loc>https://wenzee.example/faq</loc>');
    expect(xml).toContain('<loc>https://wenzee.example/categories/traiteurs</loc>');
    expect(xml).toContain(
      '<loc>https://wenzee.example/prestataires/saveurs-de-dakar</loc><lastmod>2026-11-02</lastmod>',
    );
    expect(xml).not.toContain('brouillon');
  });

  it('n’inclut jamais les espaces privés', () => {
    expect(xml).not.toMatch(/\/(espace|pro|admin)\//);
  });

  it('échappe les caractères spéciaux XML', () => {
    const escaped = buildSitemap('https://a.example', {
      categories: [{ slug: 'a&b' }],
      providers: [],
    });
    expect(escaped).toContain('/categories/a&amp;b');
  });
});

describe('buildRobotsTxt', () => {
  it('ferme tout le site hors production (préviews)', () => {
    expect(buildRobotsTxt('https://x.example', { allowIndexing: false })).toBe(
      'User-agent: *\nDisallow: /\n',
    );
  });

  it('en production : espaces privés exclus et plan du site indiqué', () => {
    const robots = buildRobotsTxt('https://x.example/', { allowIndexing: true });
    expect(robots).toContain('Disallow: /espace/');
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Sitemap: https://x.example/sitemap.xml');
  });
});

describe('buildProviderJsonLd', () => {
  const base = {
    displayName: 'Saveurs de Dakar',
    slug: 'saveurs-de-dakar',
    bio: 'Cuisine sénégalaise',
    city: 'Montreuil',
    categoryNames: ['Traiteurs'],
    ratingCount: 0,
  };

  it('convertit le prix en euros et ajoute la note seulement s’il y a des avis', () => {
    const noReviews = buildProviderJsonLd('https://t.example', { ...base, priceFrom: 2500 });
    expect(noReviews).toMatchObject({
      '@type': 'LocalBusiness',
      url: 'https://t.example/prestataires/saveurs-de-dakar',
      priceRange: 'À partir de 25 €',
      address: { addressLocality: 'Montreuil' },
    });
    expect(noReviews).not.toHaveProperty('aggregateRating');

    const rated = buildProviderJsonLd('https://t.example', {
      ...base,
      ratingAverage: 4.8,
      ratingCount: 12,
    });
    expect(rated.aggregateRating).toMatchObject({ ratingValue: 4.8, reviewCount: 12 });
    expect(rated).not.toHaveProperty('priceRange');
  });
});
