import type { Category, CulturalOrigin, ProviderCard } from '../types';

/*
 * Jeu de données de départ pour les mocks.
 * Il est typé avec les types déduits des schémas Zod : si une donnée est
 * incorrecte, TypeScript le signale à la compilation (et un test le vérifie).
 * Il sera enrichi au lot 1 (≈ 25 prestataires, demandes, comptes de démo).
 */

export const seedCategories: Category[] = [
  { id: 'cat-food', name: 'Nourriture', slug: 'nourriture', icon: '🍲', order: 1 },
  { id: 'cat-caterer', name: 'Traiteur', slug: 'traiteurs', parentId: 'cat-food', order: 1 },
  { id: 'cat-pastry', name: 'Pâtisserie', slug: 'patisserie', parentId: 'cat-food', order: 2 },
  { id: 'cat-show', name: 'Spectacle', slug: 'spectacle', icon: '💃', order: 2 },
  { id: 'cat-dance', name: 'Danse', slug: 'danse', parentId: 'cat-show', order: 1 },
  { id: 'cat-music', name: 'Musique live', slug: 'musique-live', parentId: 'cat-show', order: 2 },
  { id: 'cat-dj', name: 'DJ', slug: 'dj', parentId: 'cat-show', order: 3 },
  { id: 'cat-talk', name: 'Conférence', slug: 'conference', icon: '🎤', order: 3 },
  { id: 'cat-speaker', name: 'Speaker', slug: 'speakers', parentId: 'cat-talk', order: 1 },
  { id: 'cat-beauty', name: 'Beauté', slug: 'beaute', icon: '✨', order: 4 },
  { id: 'cat-hair', name: 'Coiffure', slug: 'coiffure', parentId: 'cat-beauty', order: 1 },
  { id: 'cat-deco', name: 'Décoration', slug: 'decoration', icon: '🎀', order: 5 },
];

export const seedCulturalOrigins: CulturalOrigin[] = [
  { id: 'or-sn', name: 'Sénégal', slug: 'senegal', region: "Afrique de l'Ouest" },
  { id: 'or-ci', name: "Côte d'Ivoire", slug: 'cote-d-ivoire', region: "Afrique de l'Ouest" },
  { id: 'or-ml', name: 'Mali', slug: 'mali', region: "Afrique de l'Ouest" },
  { id: 'or-cm', name: 'Cameroun', slug: 'cameroun', region: 'Afrique centrale' },
  { id: 'or-cd', name: 'Congo (RDC)', slug: 'congo-rdc', region: 'Afrique centrale' },
  { id: 'or-an', name: 'Antilles', slug: 'antilles', region: 'Caraïbes' },
];

export const seedProviders: ProviderCard[] = [
  {
    id: 'prov-1',
    slug: 'saveurs-de-dakar',
    displayName: 'Saveurs de Dakar',
    city: 'Paris',
    categoryIds: ['cat-caterer'],
    culturalOriginIds: ['or-sn'],
    priceFrom: 90000,
    ratingAverage: 4.8,
    ratingCount: 37,
    isProVerified: true,
  },
  {
    id: 'prov-2',
    slug: 'compagnie-akwaba',
    displayName: 'Compagnie Akwaba',
    city: 'Saint-Denis',
    categoryIds: ['cat-dance'],
    culturalOriginIds: ['or-ci'],
    priceFrom: 40000,
    ratingAverage: 4.9,
    ratingCount: 21,
    isProVerified: false,
  },
  {
    id: 'prov-3',
    slug: 'dj-makossa-vibes',
    displayName: 'DJ Makossa Vibes',
    city: 'Créteil',
    categoryIds: ['cat-dj'],
    culturalOriginIds: ['or-cm'],
    priceFrom: 35000,
    ratingAverage: 4.6,
    ratingCount: 54,
    isProVerified: true,
  },
  {
    id: 'prov-4',
    slug: 'douceurs-creoles',
    displayName: 'Douceurs Créoles',
    city: 'Montreuil',
    categoryIds: ['cat-pastry'],
    culturalOriginIds: ['or-an'],
    priceFrom: 15000,
    ratingAverage: 4.7,
    ratingCount: 18,
    isProVerified: false,
  },
  {
    id: 'prov-5',
    slug: 'awa-conferences',
    displayName: 'Awa Diallo, conférencière',
    city: 'Paris',
    categoryIds: ['cat-speaker'],
    culturalOriginIds: ['or-ml'],
    ratingAverage: 5,
    ratingCount: 9,
    isProVerified: true,
  },
  {
    id: 'prov-6',
    slug: 'kinshasa-groove',
    displayName: 'Kinshasa Groove',
    city: 'Nanterre',
    categoryIds: ['cat-music'],
    culturalOriginIds: ['or-cd'],
    priceFrom: 120000,
    ratingAverage: 4.5,
    ratingCount: 12,
    isProVerified: false,
  },
];
