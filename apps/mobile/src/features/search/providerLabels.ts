import type { Category, ProviderCard } from '@afro/common';

/** La catégorie principale d'un prestataire : celle de sa première catégorie (ou son parent). */
export function mainCategoryOf(ids: string[], categories: Category[] | undefined) {
  const category = categories?.find((c) => ids.includes(c.id));
  if (!category?.parentId) return category;
  return categories?.find((c) => c.id === category.parentId) ?? category;
}

/** « Coup de cœur » : très bien noté par assez de clients (comme « Coup de cœur voyageurs » d'Airbnb). */
export function isCrowdFavorite(provider: Pick<ProviderCard, 'ratingAverage' | 'ratingCount'>) {
  return provider.ratingAverage >= 4.8 && provider.ratingCount >= 5;
}
