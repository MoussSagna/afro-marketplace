import { delay, http, HttpResponse } from 'msw';
import { isProviderAvailable, isProviderPublic } from '../../rules';
import { providerSearchFiltersSchema, publicProviderProfileSchema } from '../../schemas';
import { addDays, daysBetween } from '../../utils/dates';
import type { MockDb } from '../db';
import { toPublicUser } from '../mappers';
import { searchProviders } from '../search';
import { apiError } from './http';

/** Lit les filtres de recherche depuis l'adresse (« ?category=traiteurs&origins=senegal,mali »). */
export function filtersFromSearchParams(params: URLSearchParams) {
  const text = (key: string) => params.get(key) || undefined;
  const number = (key: string) => {
    const value = params.get(key);
    return value === null || value === '' ? undefined : Number(value);
  };
  return providerSearchFiltersSchema.safeParse({
    q: text('q'),
    category: text('category'),
    origins: text('origins')?.split(','),
    city: text('city'),
    date: text('date'),
    budgetMax: number('budgetMax'),
    guests: number('guests'),
    minRating: number('minRating'),
    verifiedOnly: params.get('verifiedOnly') === 'true' ? true : undefined,
    sort: text('sort'),
    page: number('page'),
    pageSize: number('pageSize'),
  });
}

/** Recherche et profil public des prestataires (lot 3). */
export function providerHandlers(db: MockDb) {
  /** Un prestataire visible du public, par id ou par slug. */
  const findPublic = (idOrSlug: string) =>
    db.data.providers.find(
      (p) => (p.id === idOrSlug || p.slug === idOrSlug) && isProviderPublic(p),
    );

  return [
    http.get('*/api/providers', async ({ request }) => {
      await delay();
      const filters = filtersFromSearchParams(new URL(request.url).searchParams);
      if (!filters.success) {
        return apiError(400, 'invalid_filters', 'Les filtres de recherche sont invalides.');
      }
      return HttpResponse.json(searchProviders(db.data, filters.data));
    }),

    http.get('*/api/providers/:providerId/unavailable-dates', async ({ params, request }) => {
      await delay();
      const provider = findPublic(String(params.providerId));
      if (!provider) return apiError(404, 'provider_not_found', 'Prestataire introuvable.');

      const url = new URL(request.url);
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      if (!from || !to || daysBetween(from, to) < 0 || daysBetween(from, to) > 400) {
        return apiError(400, 'invalid_range', 'Période invalide.');
      }
      // On renvoie seulement les jours indisponibles, sans dire pourquoi (vie privée).
      const unavailabilities = db.data.unavailabilities.filter((u) => u.providerId === provider.id);
      const days: string[] = [];
      for (let day = from; day <= to; day = addDays(day, 1)) {
        if (!isProviderAvailable({ ...provider, unavailabilities }, day)) days.push(day);
      }
      return HttpResponse.json(days);
    }),

    http.get('*/api/providers/:providerId/reviews', async ({ params }) => {
      await delay();
      const provider = findPublic(String(params.providerId));
      if (!provider) return apiError(404, 'provider_not_found', 'Prestataire introuvable.');

      const reviews = db.data.reviews
        .filter((r) => r.providerId === provider.id && r.status === 'published')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((review) => {
          const author = db.data.users.find((u) => u.id === review.authorId)!;
          return { ...review, author: toPublicUser(author) };
        });
      return HttpResponse.json(reviews);
    }),

    // Attention à l'ordre : cette route attrape tout « /api/providers/xxx ».
    // Les routes plus précises (« featured ») sont déclarées avant, dans catalogue.ts.
    http.get('*/api/providers/:slug', async ({ params }) => {
      await delay();
      const provider = findPublic(String(params.slug));
      if (!provider) return apiError(404, 'provider_not_found', 'Prestataire introuvable.');

      return HttpResponse.json({
        // parse() retire les champs internes (SIRET, motif de refus…) : Zod ignore les clés inconnues.
        profile: publicProviderProfileSchema.parse(provider),
        offerings: db.data.offerings.filter((o) => o.providerId === provider.id && o.isActive),
        media: db.data.media
          .filter((m) => m.providerId === provider.id)
          .sort((a, b) => a.order - b.order),
      });
    }),
  ];
}
