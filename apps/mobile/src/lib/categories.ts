import type { Category } from '@afro/common';

/** Les catégories principales (sans parent), dans l'ordre choisi par l'équipe. */
export function mainCategories(categories: readonly Category[]): Category[] {
  return categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
}
