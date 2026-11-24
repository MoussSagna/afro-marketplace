import type { Category } from '@afro/common';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Le nom d'une catégorie dans la langue de l'app. Les données de démo sont en français :
 * on traduit par le slug (« beaute » → « Beauty »), et on garde le nom d'origine si la
 * catégorie n'a pas (encore) de traduction (les sous-catégories, par exemple).
 */
export function useCategoryName() {
  const { t } = useTranslation();
  return useCallback(
    (category: Pick<Category, 'slug' | 'name'>) =>
      t(`categories.${category.slug}` as 'categories.beaute', { defaultValue: category.name }),
    [t],
  );
}
