import beaute from '../../../assets/images/categories/beaute.webp';
import conference from '../../../assets/images/categories/conference.webp';
import decoration from '../../../assets/images/categories/decoration.webp';
import nourriture from '../../../assets/images/categories/nourriture.webp';
import spectacle from '../../../assets/images/categories/spectacle.webp';

/** Les photos des catégories principales (étape « Quoi ? »), recadrées depuis la maquette. Clé = slug. */
export const CATEGORY_PHOTOS: Record<string, number> = {
  nourriture,
  spectacle,
  conference,
  beaute,
  decoration,
};
