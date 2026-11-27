import type { Category } from '@afro/common';
import {
  Building2,
  Camera,
  ConciergeBell,
  Flower2,
  Music,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

/**
 * L'icône d'une grande famille de prestations (les 8 groupes du catalogue).
 * Les catégories du catalogue n'ont qu'un emoji : sur la fiche, on veut une icône du design system.
 */
const GROUP_ICONS: Record<string, LucideIcon> = {
  'cat-planning': Building2,
  'cat-food': UtensilsCrossed,
  'cat-fashion': Shirt,
  'cat-deco': Flower2,
  'cat-show': Music,
  'cat-beauty': Sparkles,
  'cat-media': Camera,
  'cat-services': ConciergeBell,
};

/** L'icône d'une catégorie : celle de son groupe (ou du groupe lui-même), sinon des étincelles. */
export function categoryIcon(category: Pick<Category, 'id' | 'parentId'> | undefined): LucideIcon {
  if (!category) return Sparkles;
  return GROUP_ICONS[category.parentId ?? category.id] ?? Sparkles;
}
