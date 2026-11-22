import { isProviderAvailable, isProviderPublic } from '../rules';
import type { ProviderProfile, ProviderSearchFilters, ProviderSearchResult } from '../types';
import type { MockData } from './data';
import { toProviderCard } from './mappers';

export const DEFAULT_PAGE_SIZE = 12;

/** Minuscules et sans accents : « Côte d'Ivoire » → « cote d'ivoire ». */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * La recherche de prestataires (P2), telle que le serveur la fera.
 * Fonction pure : elle prend les données et les filtres, et renvoie une page de résultats.
 * Le vrai back-end fera la même chose en SQL (lot 10).
 */
export function searchProviders(
  data: Pick<
    MockData,
    'providers' | 'categories' | 'culturalOrigins' | 'offerings' | 'unavailabilities'
  >,
  filters: ProviderSearchFilters,
): ProviderSearchResult {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  // Une catégorie principale (« Spectacle ») inclut ses sous-catégories (« Danse », « DJ »…).
  const category = filters.category
    ? data.categories.find((c) => c.slug === filters.category)
    : undefined;
  const categoryIds = category
    ? new Set([
        category.id,
        ...data.categories.filter((c) => c.parentId === category.id).map((c) => c.id),
      ])
    : undefined;

  const originIds = filters.origins?.length
    ? new Set(
        data.culturalOrigins.filter((o) => filters.origins!.includes(o.slug)).map((o) => o.id),
      )
    : undefined;

  const query = filters.q ? normalizeText(filters.q) : '';
  const city = filters.city ? normalizeText(filters.city) : '';

  const matches = (provider: ProviderProfile): boolean => {
    if (!isProviderPublic(provider)) return false;
    // Catégorie inconnue → aucun résultat (plutôt que tout montrer).
    if (filters.category && !categoryIds) return false;
    if (categoryIds && !provider.categoryIds.some((id) => categoryIds.has(id))) return false;
    if (originIds && !provider.culturalOriginIds.some((id) => originIds.has(id))) return false;
    if (
      query &&
      !normalizeText(`${provider.displayName} ${provider.city} ${provider.bio}`).includes(query)
    ) {
      return false;
    }
    if (city && !normalizeText(provider.city).includes(city)) return false;
    if (filters.verifiedOnly && !provider.isProVerified) return false;
    if (filters.minRating !== undefined && provider.ratingAverage < filters.minRating) return false;
    // Budget : on garde les prestataires « sur devis » (sans prix), on ne peut pas les exclure.
    if (
      filters.budgetMax !== undefined &&
      provider.priceFrom !== undefined &&
      provider.priceFrom > filters.budgetMax
    ) {
      return false;
    }
    if (filters.guests !== undefined) {
      const offerings = data.offerings.filter((o) => o.providerId === provider.id && o.isActive);
      const canHost = offerings.some(
        (o) => o.maxGuests === undefined || o.maxGuests >= filters.guests!,
      );
      if (!canHost) return false;
    }
    // Règle n° 3 : seulement les prestataires disponibles à la date choisie.
    if (filters.date) {
      const unavailabilities = data.unavailabilities.filter((u) => u.providerId === provider.id);
      if (!isProviderAvailable({ ...provider, unavailabilities }, filters.date)) return false;
    }
    return true;
  };

  const byRating = (a: ProviderProfile, b: ProviderProfile) =>
    b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount;
  // Les prestataires « sur devis » (sans prix) vont en fin de liste quand on trie par prix.
  const price = (p: ProviderProfile, missing: number) => p.priceFrom ?? missing;

  const sorted = data.providers.filter(matches).sort((a, b) => {
    switch (filters.sort) {
      case 'price_asc':
        return price(a, Infinity) - price(b, Infinity) || byRating(a, b);
      case 'price_desc':
        return price(b, -Infinity) - price(a, -Infinity) || byRating(a, b);
      case 'rating':
        return byRating(a, b);
      default:
        // « Pertinence » : la note, pondérée par le nombre d'avis (4,8 sur 30 avis > 5 sur 1 avis).
        return relevance(b) - relevance(a) || a.displayName.localeCompare(b.displayName, 'fr');
    }
  });

  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize).map(toProviderCard),
    total: sorted.length,
    page,
    pageSize,
  };
}

/**
 * Note « bayésienne » : on fait comme si chaque prestataire avait aussi 3 avis à 4/5.
 * Un nouveau venu avec un seul 5/5 ne passe donc pas devant un habitué très bien noté.
 */
function relevance(provider: ProviderProfile): number {
  const PRIOR_COUNT = 3;
  const PRIOR_RATING = 4;
  return (
    (provider.ratingAverage * provider.ratingCount + PRIOR_RATING * PRIOR_COUNT) /
    (provider.ratingCount + PRIOR_COUNT)
  );
}
