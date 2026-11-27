import type { Category } from '@afro/common';
import type { Href } from 'expo-router';

/**
 * L'adresse de l'onglet Recherche, le premier onglet (« / »), filtrée sur une catégorie
 * si on en donne une (« /?categorie=beaute », comme `?categorie=` sur le site).
 */
export function searchHref(category?: Pick<Category, 'slug'>): Href {
  return category ? { pathname: '/', params: { categorie: category.slug } } : '/';
}
