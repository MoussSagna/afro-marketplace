import { describe, expect, it } from 'vitest';
import { countActiveFilters, filtersFromParams, paramsFromFilters } from './searchParams';

describe('filtres ↔ adresse', () => {
  it('lit tous les filtres depuis l’adresse', () => {
    const params = new URLSearchParams(
      'q=mariage&categorie=traiteurs&origines=senegal,mali&ville=Paris&date=2027-06-12&budget=2000&invites=120&note=4&verifie=1&tri=prix-croissant&page=2',
    );
    expect(filtersFromParams(params)).toEqual({
      q: 'mariage',
      category: 'traiteurs',
      origins: ['senegal', 'mali'],
      city: 'Paris',
      date: '2027-06-12',
      budgetMax: 200000, // 2 000 € en centimes
      guests: 120,
      minRating: 4,
      verifiedOnly: true,
      sort: 'price_asc',
      page: 2,
    });
  });

  it('fait l’aller-retour sans perte', () => {
    const query = 'categorie=dj&origines=cameroun&budget=500&tri=note&page=3';
    expect(paramsFromFilters(filtersFromParams(new URLSearchParams(query))).toString()).toBe(query);
  });

  it('ignore les valeurs invalides au lieu de planter', () => {
    const filters = filtersFromParams(
      new URLSearchParams('budget=abc&invites=-3&date=demain&tri=nimporte&page=0&note=9'),
    );
    expect(filters).toEqual({
      q: undefined,
      category: undefined,
      origins: undefined,
      city: undefined,
      date: undefined,
      budgetMax: undefined,
      guests: undefined,
      minRating: 5,
      verifiedOnly: undefined,
      sort: undefined,
      page: undefined,
    });
  });

  it('n’écrit pas les valeurs par défaut (tri par pertinence, page 1)', () => {
    expect(paramsFromFilters({ sort: 'relevance', page: 1 }).toString()).toBe('');
  });

  it('compte les filtres actifs (hors catégorie et tri)', () => {
    expect(countActiveFilters({ category: 'dj', origins: ['mali'], verifiedOnly: true })).toBe(2);
  });
});
