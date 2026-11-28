import type { Category, ProviderCard } from '@afro/common';
import { favoritesView } from './favoritesView';

const cat = (id: string, order: number, parentId?: string): Category => ({
  id,
  name: id,
  slug: id,
  order,
  ...(parentId ? { parentId } : {}),
});
const categories = [
  cat('food', 1),
  cat('music', 2),
  cat('dj', 3, 'music'), // sous-catégorie : comptée dans « music »
  cat('beauty', 4),
];
const card = (id: string, categoryId: string): ProviderCard => ({
  id,
  slug: id,
  displayName: id,
  city: 'Paris',
  categoryIds: [categoryId],
  culturalOriginIds: [],
  ratingAverage: 4.5,
  ratingCount: 3,
  isProVerified: false,
});
const cards = [card('a', 'food'), card('b', 'dj'), card('c', 'music'), card('d', 'beauty')];

describe('favoritesView', () => {
  it('garde l’ordre des cœurs (le plus récent d’abord), pas celui de la recherche', () => {
    const view = favoritesView(['c', 'a', 'b'], cards, categories, null);
    expect(view.items.map((c) => c.id)).toEqual(['c', 'a', 'b']);
    expect(view.total).toBe(3);
  });

  it('un cœur retiré disparaît aussitôt, même si les cartes chargées le contiennent encore', () => {
    expect(favoritesView(['a'], cards, categories, null).items.map((c) => c.id)).toEqual(['a']);
  });

  it('ignore un favori introuvable (profil retiré) et attend les cartes sans planter', () => {
    expect(favoritesView(['zzz', 'a'], cards, categories, null).total).toBe(1);
    expect(favoritesView(['a'], undefined, undefined, null)).toMatchObject({ total: 0, chips: [] });
  });

  it('une pastille par catégorie principale, la plus fournie d’abord, puis dans l’ordre du catalogue', () => {
    const view = favoritesView(['a', 'b', 'c', 'd'], cards, categories, null);
    expect(view.chips.map((c) => [c.category.id, c.count])).toEqual([
      ['music', 2],
      ['food', 1],
      ['beauty', 1],
    ]);
  });

  it('filtre par catégorie principale (sous-catégories comprises)', () => {
    const view = favoritesView(['a', 'b', 'c', 'd'], cards, categories, 'music');
    expect(view.items.map((c) => c.id)).toEqual(['b', 'c']);
    expect(view.total).toBe(4); // le compteur reste celui de tous les favoris
    expect(view.selectedId).toBe('music');
  });

  it('revient à « Tous » si la catégorie choisie n’a plus de favori', () => {
    const view = favoritesView(['a'], cards, categories, 'music');
    expect(view.selectedId).toBeNull();
    expect(view.items.map((c) => c.id)).toEqual(['a']);
  });
});
