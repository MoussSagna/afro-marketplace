import {
  ConciergeBell,
  Headphones,
  Mic,
  PersonStanding,
  Shirt,
  Sparkles,
  Star,
  Tent,
  type LucideIcon,
} from 'lucide-react';
import { HOME_CATEGORIES } from './homeCategories';

/** Une photo du carrousel de l'accueil. */
export interface HeroSlide {
  id: string;
  /** Nom de l'ambiance, lu par les lecteurs d'écran (« 1 sur 3 : … »). */
  label: string;
  src: string;
  /** Versions plus légères pour les petits écrans (`srcset`). */
  srcSet?: string;
  /** Cadrage de la photo : ce qui doit rester visible (ex. le couple à droite). */
  position: { desktop: string; mobile: string };
}

/**
 * Les 3 ambiances du hero. Photos dans `public/images/hero/` (WebP), fournies par Mouss.
 */
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'mariage',
    label: 'Mariage afro et caribéen',
    src: '/images/hero/mariage.webp',
    srcSet: '/images/hero/mariage-900.webp 900w, /images/hero/mariage.webp 1536w',
    position: { desktop: '42% 30%', mobile: '58% 30%' },
  },
  {
    id: 'soiree',
    label: 'Soirée musicale et danse',
    src: '/images/hero/soiree.webp',
    position: { desktop: '52% 35%', mobile: '52% 30%' },
  },
  {
    id: 'celebration',
    label: 'Célébration et événement festif',
    src: '/images/hero/celebration.webp',
    srcSet: '/images/hero/celebration-900.webp 900w, /images/hero/celebration.webp 1600w',
    position: { desktop: '55% 40%', mobile: '52% 35%' },
  },
];

/** Délai entre deux photos quand le carrousel défile tout seul. */
export const HERO_AUTOPLAY_MS = 6000;

/** Un raccourci du hero vers une recherche par catégorie. */
export interface CategoryShortcut {
  label: string;
  /** Slug d'une catégorie du catalogue (`packages/common/src/mocks/seed/catalogue.ts`). */
  categorySlug: string;
  icon: LucideIcon;
}

/** Les 8 catégories populaires du hero, dans l'ordre de la maquette. */
export const CATEGORY_SHORTCUTS: CategoryShortcut[] = [
  { ...HOME_CATEGORIES.traiteur, icon: ConciergeBell },
  { ...HOME_CATEGORIES.danse, icon: PersonStanding },
  { ...HOME_CATEGORIES.musique, icon: Headphones },
  { ...HOME_CATEGORIES.show, icon: Star },
  { ...HOME_CATEGORIES.speaker, icon: Mic },
  { ...HOME_CATEGORIES.beaute, icon: Sparkles },
  { ...HOME_CATEGORIES.mode, icon: Shirt },
  { ...HOME_CATEGORIES.decoration, icon: Tent },
];
