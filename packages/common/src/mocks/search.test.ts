import { describe, expect, it } from 'vitest';
import { addDays } from '../utils/dates';
import { buildSeed } from './seed';
import { normalizeText, searchProviders } from './search';

const TODAY = '2026-11-22';
const data = buildSeed(new Date(`${TODAY}T12:00:00Z`));
const all = (filters: Parameters<typeof searchProviders>[1] = {}) =>
  searchProviders(data, { pageSize: 50, ...filters });
const slugs = (filters: Parameters<typeof searchProviders>[1] = {}) =>
  all(filters).items.map((p) => p.slug);

describe('searchProviders', () => {
  it('ne montre que les profils publiés', () => {
    const result = all();
    expect(result.total).toBe(data.providers.filter((p) => p.status === 'published').length);
    expect(slugs()).not.toContain('kompa-vibes-haiti'); // en attente de validation
    expect(slugs()).not.toContain('atelier-kente'); // en pause
  });

  it('filtre par sous-catégorie', () => {
    expect(slugs({ category: 'dj' }).sort()).toEqual(['afro-beats-by-kofi', 'dj-makossa-vibes']);
  });

  it('une catégorie principale inclut ses sous-catégories', () => {
    const show = slugs({ category: 'musique-animation' });
    expect(show).toContain('dj-makossa-vibes'); // DJ
    expect(show).toContain('compagnie-akwaba'); // Danse
    expect(show).not.toContain('saveurs-de-dakar'); // Traiteur
  });

  it('ne renvoie rien pour une catégorie inconnue', () => {
    expect(all({ category: 'inconnue' }).total).toBe(0);
  });

  it('filtre par origine (au moins une des origines cochées)', () => {
    const senegal = slugs({ origins: ['senegal'] });
    expect(senegal).toContain('saveurs-de-dakar');
    expect(senegal).not.toContain('compagnie-akwaba');
    const both = slugs({ origins: ['senegal', 'cote-d-ivoire'] });
    expect(both).toContain('compagnie-akwaba');
  });

  it('combine catégorie ET origine (« traiteur » et « ivoirien »)', () => {
    expect(slugs({ category: 'traiteurs', origins: ['cote-d-ivoire'] })).toEqual([
      'chez-tantie-adjoua',
    ]);
  });

  it('cherche le texte sans tenir compte des accents ni des majuscules', () => {
    expect(slugs({ q: 'CREOLES' })).toContain('douceurs-creoles');
    expect(slugs({ q: 'thiéboudienne' })).toContain('saveurs-de-dakar');
  });

  it('filtre par ville', () => {
    expect(slugs({ city: 'creteil' })).toEqual(['dj-makossa-vibes']);
  });

  it('chacun des 8 groupes de catégories a au moins un prestataire publié', () => {
    const groups = data.categories.filter((category) => !category.parentId);
    expect(groups).toHaveLength(8);
    for (const group of groups) {
      expect(slugs({ category: group.slug }), group.name).not.toHaveLength(0);
    }
  });

  it('règle n° 3 : exclut les prestataires indisponibles à la date choisie', () => {
    const blocked = addDays(TODAY, 15); // bloqué à la main par Saveurs de Dakar
    expect(slugs({ date: blocked })).not.toContain('saveurs-de-dakar');
    expect(slugs({ date: addDays(TODAY, 17) })).toContain('saveurs-de-dakar');
  });

  it('filtre par budget en gardant les prestataires « sur devis »', () => {
    const result = all({ budgetMax: 30000 });
    for (const provider of result.items) {
      if (provider.priceFrom !== undefined) expect(provider.priceFrom).toBeLessThanOrEqual(30000);
    }
    expect(result.items.map((p) => p.slug)).toContain('awa-diallo-conferenciere');
  });

  it('filtre par nombre d’invités', () => {
    // Le Mafé Truck accueille 300 invités maximum ; Yaoundé Grill n'a pas de limite.
    expect(slugs({ category: 'food-trucks', guests: 400 })).toEqual(['yaounde-grill']);
    expect(slugs({ category: 'food-trucks', guests: 250 }).sort()).toEqual([
      'le-mafe-truck',
      'yaounde-grill',
    ]);
  });

  it('filtre par note minimale et par badge vérifié', () => {
    for (const p of all({ minRating: 4.8 }).items)
      expect(p.ratingAverage).toBeGreaterThanOrEqual(4.8);
    for (const p of all({ verifiedOnly: true }).items) expect(p.isProVerified).toBe(true);
  });

  it('trie par prix croissant, les « sur devis » à la fin', () => {
    const items = all({ sort: 'price_asc' }).items;
    const prices = items.map((p) => p.priceFrom ?? Infinity);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(items.at(-1)?.priceFrom).toBeUndefined();
  });

  it('trie par prix décroissant', () => {
    const prices = all({ sort: 'price_desc' })
      .items.filter((p) => p.priceFrom !== undefined)
      .map((p) => p.priceFrom!);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it('trie par note', () => {
    const ratings = all({ sort: 'rating' }).items.map((p) => p.ratingAverage);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it('pagine les résultats', () => {
    const first = searchProviders(data, { pageSize: 5 });
    const second = searchProviders(data, { pageSize: 5, page: 2 });
    expect(first.items).toHaveLength(5);
    expect(first.total).toBe(all().total);
    expect(second.page).toBe(2);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
    expect(searchProviders(data, { page: 99 }).items).toEqual([]);
  });
});

describe('normalizeText', () => {
  it('retire accents et majuscules', () => {
    expect(normalizeText("  Côte d'Ivoire ")).toBe("cote d'ivoire");
  });
});
