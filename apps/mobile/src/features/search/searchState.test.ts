import { isSearching, searchMode } from './searchState';

describe('les deux états de la Recherche', () => {
  it('une recherche est en cours dès qu’un texte, une catégorie ou un filtre est choisi', () => {
    expect(isSearching({})).toBe(false);
    expect(isSearching({ sort: 'relevance', page: 2 })).toBe(false);
    expect(isSearching({ q: 'dj' })).toBe(true);
    expect(isSearching({ category: 'beaute-soins' })).toBe(true);
    expect(isSearching({ origins: [] })).toBe(false);
    expect(isSearching({ origins: ['senegal'] })).toBe(true);
    expect(isSearching({ verifiedOnly: true })).toBe(true);
    expect(isSearching({ sort: 'rating' })).toBe(true);
  });

  it('« résultats » avec une recherche, ou si l’adresse le demande ; « home » sinon', () => {
    expect(searchMode({}, undefined)).toBe('home');
    expect(searchMode({}, 'autre')).toBe('home');
    expect(searchMode({}, 'resultats')).toBe('results');
    expect(searchMode({ city: 'Paris' }, undefined)).toBe('results');
  });
});
