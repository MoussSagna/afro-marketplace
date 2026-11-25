import beauteSoins from '../../../assets/images/categories/beaute-soins.webp';
import decoLocation from '../../../assets/images/categories/deco-location.webp';
import modeTenues from '../../../assets/images/categories/mode-tenues.webp';
import musiqueAnimation from '../../../assets/images/categories/musique-animation.webp';
import traiteurBoissons from '../../../assets/images/categories/traiteur-boissons.webp';

/**
 * Les photos des catégories principales (étape « Quoi ? »), recadrées depuis la maquette. Clé = slug.
 * Organisation & lieux, Photo & vidéo et Services événementiels n'ont pas encore de photo :
 * l'étape affiche alors leur icône (voir `CategoryTile` dans SearchWizard).
 */
export const CATEGORY_PHOTOS: Partial<Record<string, number>> = {
  'traiteur-boissons': traiteurBoissons,
  'mode-tenues': modeTenues,
  'deco-location': decoLocation,
  'musique-animation': musiqueAnimation,
  'beaute-soins': beauteSoins,
};
