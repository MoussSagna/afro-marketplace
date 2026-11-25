import type { Category, CulturalOrigin } from '../../types';

/**
 * Une catégorie principale et ses sous-catégories, en format compact.
 * `sub` : [id, nom, slug]. L'ordre du tableau donne le champ `order`.
 */
interface CategoryGroup {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sub: [id: string, name: string, slug: string][];
}

/*
 * L'arborescence des catégories : 8 groupes et leurs sous-catégories.
 * Inspirée des grands annuaires de prestataires d'événements afro, traduite et adaptée à la France
 * (cérémonie laïque, wax, gélé, food trucks, humour, speakers…).
 *
 * Les identifiants des sous-catégories historiques (cat-caterer, cat-dj, cat-hair…) sont gardés :
 * les prestataires de démo et les tests y font référence.
 */
const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'cat-planning',
    name: 'Organisation & lieux',
    slug: 'organisation-lieux',
    icon: '📋',
    sub: [
      ['cat-planner', 'Organisateurs & wedding planners', 'wedding-planners'],
      ['cat-day-coordinator', 'Coordinateurs jour J', 'coordinateurs-jour-j'],
      ['cat-producer', 'Production événementielle', 'production-evenementielle'],
      ['cat-venue', 'Salles & lieux de réception', 'salles-de-reception'],
      ['cat-officiant', 'Officiants de cérémonie', 'officiants'],
      ['cat-travel', 'Agences de voyage', 'agences-de-voyage'],
    ],
  },
  {
    id: 'cat-food',
    name: 'Traiteur & boissons',
    slug: 'traiteur-boissons',
    icon: '🍲',
    sub: [
      ['cat-caterer', 'Traiteurs', 'traiteurs'],
      ['cat-pastry', 'Gâteaux & pâtisserie', 'patisserie'],
      ['cat-bartender', 'Mixologues & barmans', 'mixologues-barmans'],
      ['cat-foodtruck', 'Food trucks', 'food-trucks'],
    ],
  },
  {
    id: 'cat-fashion',
    name: 'Mode & tenues',
    slug: 'mode-tenues',
    icon: '👗',
    sub: [
      ['cat-wedding-gown', 'Robes de mariée', 'robes-de-mariee'],
      ['cat-dresses', 'Robes de soirée', 'robes-de-soiree'],
      ['cat-bridal-robe', 'Peignoirs de mariée', 'peignoirs-de-mariee'],
      ['cat-suits', 'Costumes', 'costumes'],
      ['cat-men-traditional', 'Tenues traditionnelles homme', 'tenues-traditionnelles-homme'],
      ['cat-fabrics', 'Tissus & wax', 'tissus-wax'],
      ['cat-tailor', 'Tailleurs & couturières', 'tailleurs-couturieres'],
      ['cat-stylist', 'Stylistes', 'stylistes'],
      ['cat-jewelry', 'Bijoux', 'bijoux'],
      ['cat-beads', 'Perles & accessoires', 'perles-accessoires'],
      ['cat-outfits', 'Location de tenues', 'location-de-tenues'],
    ],
  },
  {
    id: 'cat-deco',
    name: 'Déco & location',
    slug: 'deco-location',
    icon: '🎀',
    sub: [
      ['cat-venue-deco', 'Décorateurs', 'decorateurs'],
      ['cat-florist', 'Fleuristes', 'fleuristes'],
      ['cat-lighting', 'Éclairage & drapés', 'eclairage-drapes'],
      ['cat-floor', 'Habillage de sol', 'habillage-de-sol'],
      ['cat-rentals', 'Location de matériel', 'location-de-materiel'],
      ['cat-stationery', 'Papeterie & signalétique', 'papeterie-signaletique'],
      ['cat-favors', 'Cadeaux d’invités', 'cadeaux-invites'],
    ],
  },
  {
    id: 'cat-show',
    name: 'Musique & animation',
    slug: 'musique-animation',
    icon: '💃',
    sub: [
      ['cat-dj', 'DJ', 'dj'],
      ['cat-music', 'Musique live, son & groupes', 'musique-live'],
      ['cat-dance', 'Danse', 'danse'],
      ['cat-cultural', 'Animation culturelle', 'animation-culturelle'],
      ['cat-host', 'Maîtres de cérémonie & animateurs', 'animateurs'],
      ['cat-effects', 'Effets spéciaux (étincelles & fumée)', 'effets-speciaux'],
      ['cat-comedy', 'Humour', 'humour'],
      ['cat-speaker', 'Speakers & conférenciers', 'speakers'],
    ],
  },
  {
    id: 'cat-beauty',
    name: 'Beauté & soins',
    slug: 'beaute-soins',
    icon: '✨',
    sub: [
      ['cat-makeup', 'Maquillage', 'maquillage'],
      ['cat-hair', 'Coiffure', 'coiffure'],
      ['cat-headwrap', 'Attache de foulard (gélé, moussor)', 'attache-foulard'],
      ['cat-henna', 'Henné', 'henne'],
      ['cat-beauty-general', 'Esthétique & soins', 'esthetique-soins'],
      ['cat-grooming', 'Barbiers & soins homme', 'barbiers-soins-homme'],
    ],
  },
  {
    id: 'cat-media',
    name: 'Photo & vidéo',
    slug: 'photo-video',
    icon: '📸',
    sub: [
      ['cat-photographer', 'Photographes', 'photographes'],
      ['cat-videographer', 'Vidéastes', 'videastes'],
      ['cat-photobooth', 'Photobooths', 'photobooths'],
      ['cat-content', 'Créateurs de contenu', 'createurs-de-contenu'],
    ],
  },
  {
    id: 'cat-services',
    name: 'Services événementiels',
    slug: 'services-evenementiels',
    icon: '🤝',
    sub: [
      ['cat-staffing', 'Logistique & personnel', 'logistique-personnel'],
      ['cat-servers', 'Hôtes, hôtesses & serveurs', 'hotes-serveurs'],
      ['cat-security', 'Sécurité', 'securite'],
      ['cat-transport', 'Transport & voitures', 'transport'],
    ],
  },
];

/** Catégories principales puis sous-catégories, à plat (c'est ce que renvoie l'API). */
export const seedCategories: Category[] = CATEGORY_GROUPS.flatMap((group, groupIndex) => [
  { id: group.id, name: group.name, slug: group.slug, icon: group.icon, order: groupIndex + 1 },
  ...group.sub.map(([id, name, slug], index) => ({
    id,
    name,
    slug,
    parentId: group.id,
    order: index + 1,
  })),
]);

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
