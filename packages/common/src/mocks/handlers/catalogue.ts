import { delay, http, HttpResponse } from 'msw';
import { isProviderPublic } from '../../rules';
import type { MockDb } from '../db';
import { toProviderCard } from '../mappers';

/** Nombre de prestataires montrés « à la une » sur l'accueil. */
export const FEATURED_PROVIDERS_COUNT = 8;

/** Catalogue : catégories, origines, prestataires à la une (lot 0). La recherche arrive au lot 3. */
export function catalogueHandlers(db: MockDb) {
  return [
    http.get('*/api/categories', async () => {
      await delay(); // petit délai réaliste pour voir les états de chargement
      return HttpResponse.json(db.data.categories);
    }),

    http.get('*/api/cultural-origins', async () => {
      await delay();
      return HttpResponse.json(db.data.culturalOrigins);
    }),

    http.get('*/api/providers/featured', async () => {
      await delay();
      // Les mieux notés parmi les profils publiés. Plus tard : mise en avant payante (featuredUntil).
      const featured = db.data.providers
        .filter(isProviderPublic)
        .sort((a, b) => b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount)
        .slice(0, FEATURED_PROVIDERS_COUNT)
        .map(toProviderCard);
      return HttpResponse.json(featured);
    }),
  ];
}
