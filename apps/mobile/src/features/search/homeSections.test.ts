import { homeSections, nextSaturday, SMALL_BUDGET } from './homeSections';
import { isCrowdFavorite } from './providerLabels';

describe('nextSaturday', () => {
  it('donne le samedi qui vient', () => {
    expect(nextSaturday('2026-11-27')).toBe('2026-11-28'); // vendredi → lendemain
    expect(nextSaturday('2026-11-23')).toBe('2026-11-28'); // lundi
    expect(nextSaturday('2026-11-29')).toBe('2026-12-05'); // dimanche → samedi suivant
  });

  it('garde le jour même si on est samedi, et passe les fins de mois et d’année', () => {
    expect(nextSaturday('2026-11-28')).toBe('2026-11-28');
    expect(nextSaturday('2026-12-31')).toBe('2027-01-02');
  });
});

describe('homeSections', () => {
  it('quatre rangées, chacune avec sa recherche', () => {
    const sections = homeSections('2026-11-27');
    expect(sections.map((s) => s.id)).toEqual(['topRated', 'saturday', 'paris', 'smallBudget']);
    expect(sections[1]!.filters.date).toBe('2026-11-28');
    expect(sections[2]!.filters.city).toBe('Paris');
    expect(sections[3]!.filters).toEqual({ budgetMax: SMALL_BUDGET, sort: 'price_asc' });
    expect(SMALL_BUDGET).toBe(30_000); // 300 €, en centimes
  });
});

describe('isCrowdFavorite', () => {
  it('très bien noté par au moins 5 clients', () => {
    expect(isCrowdFavorite({ ratingAverage: 4.9, ratingCount: 12 })).toBe(true);
    expect(isCrowdFavorite({ ratingAverage: 4.8, ratingCount: 5 })).toBe(true);
    expect(isCrowdFavorite({ ratingAverage: 4.7, ratingCount: 40 })).toBe(false);
    expect(isCrowdFavorite({ ratingAverage: 5, ratingCount: 2 })).toBe(false);
  });
});
