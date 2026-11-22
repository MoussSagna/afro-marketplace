import type { Category, CulturalOrigin } from '../../types';

/** Catégories principales et sous-catégories (étape 2, section 4). */
export const seedCategories: Category[] = [
  { id: 'cat-food', name: 'Nourriture', slug: 'nourriture', icon: '🍲', order: 1 },
  { id: 'cat-caterer', name: 'Traiteur', slug: 'traiteurs', parentId: 'cat-food', order: 1 },
  { id: 'cat-pastry', name: 'Pâtisserie', slug: 'patisserie', parentId: 'cat-food', order: 2 },
  { id: 'cat-foodtruck', name: 'Food truck', slug: 'food-trucks', parentId: 'cat-food', order: 3 },
  { id: 'cat-show', name: 'Spectacle', slug: 'spectacle', icon: '💃', order: 2 },
  { id: 'cat-dance', name: 'Danse', slug: 'danse', parentId: 'cat-show', order: 1 },
  { id: 'cat-music', name: 'Musique live', slug: 'musique-live', parentId: 'cat-show', order: 2 },
  { id: 'cat-dj', name: 'DJ', slug: 'dj', parentId: 'cat-show', order: 3 },
  { id: 'cat-comedy', name: 'Humour', slug: 'humour', parentId: 'cat-show', order: 4 },
  { id: 'cat-talk', name: 'Conférence', slug: 'conference', icon: '🎤', order: 3 },
  { id: 'cat-speaker', name: 'Speaker', slug: 'speakers', parentId: 'cat-talk', order: 1 },
  { id: 'cat-host', name: 'Animateur', slug: 'animateurs', parentId: 'cat-talk', order: 2 },
  { id: 'cat-beauty', name: 'Beauté', slug: 'beaute', icon: '✨', order: 4 },
  { id: 'cat-hair', name: 'Coiffure', slug: 'coiffure', parentId: 'cat-beauty', order: 1 },
  { id: 'cat-makeup', name: 'Maquillage', slug: 'maquillage', parentId: 'cat-beauty', order: 2 },
  { id: 'cat-deco', name: 'Décoration', slug: 'decoration', icon: '🎀', order: 5 },
  {
    id: 'cat-venue-deco',
    name: 'Décoration de salle',
    slug: 'decoration-de-salle',
    parentId: 'cat-deco',
    order: 1,
  },
  {
    id: 'cat-outfits',
    name: 'Location de tenues',
    slug: 'location-de-tenues',
    parentId: 'cat-deco',
    order: 2,
  },
];

export const seedCulturalOrigins: CulturalOrigin[] = [
  { id: 'or-sn', name: 'Sénégal', slug: 'senegal', region: "Afrique de l'Ouest" },
  { id: 'or-ci', name: "Côte d'Ivoire", slug: 'cote-d-ivoire', region: "Afrique de l'Ouest" },
  { id: 'or-ml', name: 'Mali', slug: 'mali', region: "Afrique de l'Ouest" },
  { id: 'or-gn', name: 'Guinée', slug: 'guinee', region: "Afrique de l'Ouest" },
  { id: 'or-bj', name: 'Bénin', slug: 'benin', region: "Afrique de l'Ouest" },
  { id: 'or-tg', name: 'Togo', slug: 'togo', region: "Afrique de l'Ouest" },
  { id: 'or-ng', name: 'Nigeria', slug: 'nigeria', region: "Afrique de l'Ouest" },
  { id: 'or-gh', name: 'Ghana', slug: 'ghana', region: "Afrique de l'Ouest" },
  { id: 'or-cm', name: 'Cameroun', slug: 'cameroun', region: 'Afrique centrale' },
  { id: 'or-cd', name: 'Congo (RDC)', slug: 'congo-rdc', region: 'Afrique centrale' },
  { id: 'or-cg', name: 'Congo-Brazzaville', slug: 'congo-brazzaville', region: 'Afrique centrale' },
  { id: 'or-km', name: 'Comores', slug: 'comores', region: 'Océan Indien' },
  { id: 'or-an', name: 'Antilles', slug: 'antilles', region: 'Caraïbes' },
  { id: 'or-ht', name: 'Haïti', slug: 'haiti', region: 'Caraïbes' },
];
