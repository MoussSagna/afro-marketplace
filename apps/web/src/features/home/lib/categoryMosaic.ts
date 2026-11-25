import { HOME_CATEGORIES, type HomeCategoryId } from './homeCategories';

/**
 * Place d'une carte dans la mosaïque :
 * - `featured` : la grande carte (2 lignes sur tablette et ordinateur, toute la largeur sur téléphone) ;
 * - `wide` : toute la largeur sur téléphone seulement (pour finir la grille proprement) ;
 * - `regular` : une case.
 */
export type MosaicLayout = 'featured' | 'wide' | 'regular';

export interface MosaicCard {
  id: HomeCategoryId;
  label: string;
  categorySlug: string;
  layout: MosaicLayout;
  image: {
    src: string;
    srcSet?: string;
    /** Dimensions réelles du fichier (évitent les sauts de mise en page). */
    width: number;
    height: number;
    /** Cadrage : ce qui doit rester visible (téléphone / tablette et ordinateur). */
    position: { mobile: string; desktop: string };
  };
}

const card = (
  id: HomeCategoryId,
  layout: MosaicLayout,
  image: MosaicCard['image'],
): MosaicCard => ({ id, ...HOME_CATEGORIES[id], layout, image });

/**
 * Les 8 cartes de « Explorez nos univers », dans l'ordre de lecture de la maquette.
 * Photos : `public/images/categories/` (vignettes de l'app, 320 px) et `public/images/hero/` (grand format).
 * ⚠️ Provisoire : pas de photo de DJ ni de mode dans le projet (voir docs/categories-section-validation.md).
 * Pour changer une photo, il suffit de modifier son entrée ici.
 */
export const CATEGORY_MOSAIC: MosaicCard[] = [
  card('musique', 'featured', {
    src: '/images/hero/soiree.webp',
    width: 1872,
    height: 752,
    position: { mobile: '52% 40%', desktop: '52% 50%' },
  }),
  card('traiteur', 'regular', {
    src: '/images/categories/traiteur.webp',
    width: 320,
    height: 320,
    position: { mobile: '50% 50%', desktop: '50% 50%' },
  }),
  card('danse', 'regular', {
    src: '/images/hero/mariage.webp',
    srcSet: '/images/hero/mariage-900.webp 900w, /images/hero/mariage.webp 1536w',
    width: 1536,
    height: 1024,
    position: { mobile: '55% 25%', desktop: '45% 30%' },
  }),
  card('beaute', 'regular', {
    src: '/images/categories/beaute.webp',
    width: 320,
    height: 320,
    position: { mobile: '50% 30%', desktop: '50% 30%' },
  }),
  card('mode', 'regular', {
    src: '/images/hero/celebration.webp',
    srcSet: '/images/hero/celebration-900.webp 900w, /images/hero/celebration.webp 1600w',
    width: 1600,
    height: 900,
    position: { mobile: '12% 60%', desktop: '8% 55%' },
  }),
  card('speaker', 'regular', {
    src: '/images/categories/speaker.webp',
    width: 320,
    height: 320,
    position: { mobile: '50% 35%', desktop: '50% 30%' },
  }),
  card('show', 'regular', {
    src: '/images/categories/show.webp',
    width: 320,
    height: 320,
    position: { mobile: '50% 25%', desktop: '50% 20%' },
  }),
  card('decoration', 'wide', {
    src: '/images/categories/decoration.webp',
    width: 320,
    height: 320,
    position: { mobile: '50% 45%', desktop: '50% 45%' },
  }),
];
