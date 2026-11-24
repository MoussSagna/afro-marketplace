import type { Category } from '@afro/common';
import type { Href } from 'expo-router';

/**
 * L'adresse de l'onglet Recherche, filtrée sur une catégorie si on en donne une
 * (« /recherche?categorie=beaute », comme `?categorie=` sur le site).
 */
export function searchHref(category?: Pick<Category, 'slug'>): Href {
  return category ? { pathname: '/recherche', params: { categorie: category.slug } } : '/recherche';
}
