import { delay, http, HttpResponse } from 'msw';
import { canChangeProviderStatus, canSubmitProfileForReview, computePriceFrom } from '../../rules';
import {
  mediaInputSchema,
  offeringInputSchema,
  updateProviderProfileInputSchema,
} from '../../schemas';
import type { Media, Offering, ProviderProfile, User } from '../../types';
import { uniqueSlug } from '../../utils/slugify';
import type { MockDb } from '../db';
import { apiError, currentUser, invalidInput } from './http';

/** L'étape où commence l'onboarding (S1). 0 = pas commencé. */
export const FIRST_ONBOARDING_STEP = 1;

/**
 * Le profil du prestataire connecté : onboarding (S1), « Modifier mon profil » (S7),
 * formules, galerie, envoi en validation (règle n° 2) et mise en pause. Lot 7.
 */
export function myProviderHandlers(db: MockDb) {
  const myProvider = (user: User) => db.data.providers.find((p) => p.userId === user.id);
  const noProfile = () => apiError(404, 'no_provider_profile', 'Pas encore de profil prestataire.');

  /** Le « à partir de » suit les formules actives (voir computePriceFrom). */
  function refreshPriceFrom(provider: ProviderProfile) {
    const priceFrom = computePriceFrom(
      db.data.offerings.filter((o) => o.providerId === provider.id),
    );
    if (priceFrom === undefined) delete provider.priceFrom;
    else provider.priceFrom = priceFrom;
    provider.updatedAt = db.now().toISOString();
  }

  function details(provider: ProviderProfile) {
    return {
      profile: provider,
      offerings: db.data.offerings.filter((o) => o.providerId === provider.id),
      media: db.data.media
        .filter((m) => m.providerId === provider.id)
        .sort((a, b) => a.order - b.order),
    };
  }

  return [
    http.get('*/api/me/provider', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return noProfile();
      return HttpResponse.json(details(provider));
    }),

    // P6 → S1 : crée un profil brouillon et donne le rôle prestataire (règle n° 1).
    http.post('*/api/me/provider', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
      const existing = myProvider(user);
      if (existing) return HttpResponse.json(existing);

      const created = db.update((data) => {
        const at = db.now().toISOString();
        const displayName = `${user.firstName} ${user.lastName}`;
        const profile: ProviderProfile = {
          id: db.newId('prov'),
          userId: user.id,
          displayName,
          slug: uniqueSlug(displayName, new Set(data.providers.map((p) => p.slug))),
          bio: '',
          legalType: 'individual',
          isProVerified: false,
          categoryIds: [],
          culturalOriginIds: [],
          languages: ['fr'],
          city: '',
          postalCode: '',
          travelRadiusKm: 30,
          maxBookingsPerDay: 1,
          cancellationPolicy: 'moderate',
          status: 'draft',
          onboardingStep: FIRST_ONBOARDING_STEP,
          ratingAverage: 0,
          ratingCount: 0,
          createdAt: at,
          updatedAt: at,
        };
        data.providers.push(profile);
        if (!user.roles.includes('provider')) user.roles.push('provider');
        user.updatedAt = at;
        return profile;
      });
      return HttpResponse.json(created, { status: 201 });
    }),

    http.patch('*/api/me/provider', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return noProfile();
      const parsed = updateProviderProfileInputSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!parsed.success) return invalidInput(parsed.error);
      const { displayName, ...rest } = parsed.data;
      db.update((data) => {
        Object.assign(provider, rest, { updatedAt: db.now().toISOString() });
        if (displayName !== undefined && displayName !== provider.displayName) {
          provider.displayName = displayName;
          // L'adresse publique suit le nom tant que le profil n'a jamais été publié.
          if (provider.status === 'draft') {
            const taken = new Set(
              data.providers.filter((p) => p.id !== provider.id).map((p) => p.slug),
            );
            provider.slug = uniqueSlug(displayName, taken);
          }
        }
      });
      return HttpResponse.json(provider);
    }),

    // Règle n° 2 : envoi en validation seulement si le profil est complet.
    http.post('*/api/me/provider/submit', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return noProfile();
      const { media, offerings } = details(provider);
      const verdict = canSubmitProfileForReview(provider, media, offerings);
      if (!verdict.allowed) {
        const status = verdict.reason === 'incomplete_profile' ? 422 : 409;
        return apiError(status, verdict.reason, verdict.message);
      }
      db.update(() => {
        Object.assign(provider, {
          status: 'pending_review',
          updatedAt: db.now().toISOString(),
        });
        delete provider.rejectionReason;
      });
      return HttpResponse.json(provider);
    }),

    http.post('*/api/me/provider/pause', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return noProfile();
      const body = (await request.json().catch(() => null)) as { paused?: unknown } | null;
      if (typeof body?.paused !== 'boolean') {
        return apiError(400, 'invalid_input', 'Indique s’il faut mettre en pause ou réactiver.');
      }
      const next = body.paused ? 'paused' : 'published';
      if (!canChangeProviderStatus(provider.status, next)) {
        return apiError(
          409,
          'invalid_status',
          body.paused
            ? 'Seul un profil publié peut être mis en pause.'
            : 'Seul un profil en pause peut être réactivé.',
        );
      }
      db.update(() => {
        Object.assign(provider, { status: next, updatedAt: db.now().toISOString() });
      });
      return HttpResponse.json(provider);
    }),

    http.post('*/api/me/provider/offerings', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return noProfile();
      const parsed = offeringInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      if (!db.data.categories.some((c) => c.id === parsed.data.categoryId)) {
        return apiError(400, 'invalid_input', 'Catégorie inconnue.');
      }
      const offering = db.update((data) => {
        const at = db.now().toISOString();
        const created: Offering = {
          id: db.newId('off'),
          providerId: provider.id,
          ...parsed.data,
          createdAt: at,
          updatedAt: at,
        };
        data.offerings.push(created);
        refreshPriceFrom(provider);
        return created;
      });
      return HttpResponse.json(offering, { status: 201 });
    }),

    http.put('*/api/me/provider/offerings/:offeringId', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return noProfile();
      const offering = db.data.offerings.find(
        (o) => o.id === params.offeringId && o.providerId === provider.id,
      );
      if (!offering) return apiError(404, 'offering_not_found', 'Formule introuvable.');
      const parsed = offeringInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      db.update(() => {
        // On repart de zéro pour les champs facultatifs (un prix retiré doit disparaître).
        for (const key of ['price', 'durationMinutes', 'minGuests', 'maxGuests'] as const) {
          delete offering[key];
        }
        Object.assign(offering, parsed.data, { updatedAt: db.now().toISOString() });
        refreshPriceFrom(provider);
      });
      return HttpResponse.json(offering);
    }),

    http.delete('*/api/me/provider/offerings/:offeringId', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return noProfile();
      const offering = db.data.offerings.find(
        (o) => o.id === params.offeringId && o.providerId === provider.id,
      );
      if (!offering) return apiError(404, 'offering_not_found', 'Formule introuvable.');
      db.update((data) => {
        data.offerings = data.offerings.filter((o) => o.id !== offering.id);
        refreshPriceFrom(provider);
      });
      return new HttpResponse(null, { status: 204 });
    }),

    http.post('*/api/me/provider/media', async ({ request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return noProfile();
      const parsed = mediaInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      const mine = db.data.media.filter((m) => m.providerId === provider.id);
      if (mine.length >= 20) {
        return apiError(409, 'gallery_full', '20 photos maximum dans la galerie.');
      }
      const media = db.update((data) => {
        const at = db.now().toISOString();
        const created: Media = {
          id: db.newId('media'),
          providerId: provider.id,
          ...parsed.data,
          order: Math.max(-1, ...mine.map((m) => m.order)) + 1,
          createdAt: at,
          updatedAt: at,
        };
        data.media.push(created);
        // La première photo sert de couverture si le profil n'en a pas.
        if (!provider.coverUrl && created.type === 'image') provider.coverUrl = created.url;
        return created;
      });
      return HttpResponse.json(media, { status: 201 });
    }),

    http.delete('*/api/me/provider/media/:mediaId', async ({ params, request }) => {
      await delay();
      const user = currentUser(db, request);
      const provider = user && myProvider(user);
      if (!provider) return noProfile();
      const media = db.data.media.find(
        (m) => m.id === params.mediaId && m.providerId === provider.id,
      );
      if (!media) return apiError(404, 'media_not_found', 'Photo introuvable.');
      db.update((data) => {
        data.media = data.media.filter((m) => m.id !== media.id);
        if (provider.coverUrl === media.url) {
          const next = data.media.find((m) => m.providerId === provider.id && m.type === 'image');
          if (next) provider.coverUrl = next.url;
          else delete provider.coverUrl;
        }
      });
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
