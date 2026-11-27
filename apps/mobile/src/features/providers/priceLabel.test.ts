import { searchHref } from '../search/searchHref';
import { priceLabel } from './priceLabel';

describe('priceLabel', () => {
  it('affiche le prix de départ, ou « Sur devis »', () => {
    expect(priceLabel(2500)).toMatch(/^dès 25\s€$/);
    expect(priceLabel(undefined)).toBe('Sur devis');
  });
});

describe('searchHref', () => {
  it('ouvre la Recherche, filtrée ou non sur une catégorie', () => {
    expect(searchHref()).toBe('/');
    expect(searchHref({ slug: 'beaute' })).toEqual({
      pathname: '/',
      params: { categorie: 'beaute' },
    });
  });
});
