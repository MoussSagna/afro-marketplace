import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, createHttpApiClient } from '../../api';
import type { OfferingInput } from '../../types';
import { handlers, mockDb } from '..';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockDb.reset());
afterAll(() => server.close());

const as = (userId: string) => createHttpApiClient({ getToken: () => `demo:${userId}` });
/** Aïssatou n'est que cliente : elle va créer son profil prestataire. */
const newcomer = as('user-aissatou');
const pro = as('user-saveurs-de-dakar');

async function errorOf(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

const offering: OfferingInput = {
  categoryId: mockDb.data.categories[0]!.id,
  title: 'Gâteau d’anniversaire',
  description: '',
  pricingType: 'per_person',
  price: 450,
  minGuests: 20,
  isActive: true,
};

const photo = (n: number) => ({
  type: 'image' as const,
  url: `https://picsum.photos/seed/new-${n}/1200/800`,
});

describe('Profil prestataire : onboarding (mocké)', () => {
  it('« Créer mon profil » donne le rôle prestataire et un brouillon (règle n° 1)', async () => {
    await errorOf(newcomer.getMyProviderProfile()).then((e) => expect(e.status).toBe(404));
    const profile = await newcomer.startProviderOnboarding();
    expect(profile).toMatchObject({ status: 'draft', onboardingStep: 1, slug: 'aissatou-ndiaye' });
    expect((await newcomer.getMe()).roles).toContain('provider');
    // Deuxième appel : on retrouve le même profil.
    expect((await newcomer.startProviderOnboarding()).id).toBe(profile.id);
  });

  it('enregistre étape par étape ; l’adresse suit le nom tant que c’est un brouillon', async () => {
    await newcomer.startProviderOnboarding();
    const saved = await newcomer.updateMyProviderProfile({
      displayName: 'Les Délices d’Aïssatou',
      siret: '123 456 789 00012',
      onboardingStep: 2,
    });
    expect(saved).toMatchObject({
      slug: 'les-delices-daissatou',
      siret: '12345678900012',
      onboardingStep: 2,
    });
    const invalid = await errorOf(newcomer.updateMyProviderProfile({ siret: '123' }));
    expect(invalid.status).toBe(400);
  });

  it('règle n° 2 : envoi en validation refusé tant que le profil est incomplet', async () => {
    await newcomer.startProviderOnboarding();
    const incomplete = await errorOf(newcomer.submitMyProviderProfile());
    expect(incomplete).toMatchObject({ status: 422, code: 'incomplete_profile' });
    expect(incomplete.message).toContain('Choisis au moins une catégorie');

    await newcomer.updateMyProviderProfile({
      categoryIds: [offering.categoryId],
      city: 'Montreuil',
      postalCode: '93100',
    });
    await newcomer.createOffering(offering);
    for (const n of [1, 2, 3]) await newcomer.addMedia(photo(n));

    const submitted = await newcomer.submitMyProviderProfile();
    expect(submitted.status).toBe('pending_review');
    expect(submitted.coverUrl).toBe(photo(1).url);
    expect(submitted.priceFrom).toBe(450 * 20);

    const again = await errorOf(newcomer.submitMyProviderProfile());
    expect(again).toMatchObject({ status: 409, code: 'invalid_status' });
  });
});

describe('Profil prestataire : formules, galerie, pause (mocké)', () => {
  it('le « à partir de » suit les formules actives', async () => {
    const created = await pro.createOffering({ ...offering, pricingType: 'from', price: 100 });
    let { profile } = await pro.getMyProviderProfile();
    expect(profile.priceFrom).toBe(100);

    await pro.updateOffering(created.id, {
      ...offering,
      pricingType: 'on_quote',
      price: undefined,
    });
    const { offerings } = await pro.getMyProviderProfile();
    expect(offerings.find((o) => o.id === created.id)!.price).toBeUndefined();

    await pro.deleteOffering(created.id);
    ({ profile } = await pro.getMyProviderProfile());
    expect(profile.priceFrom).not.toBe(100);
    await errorOf(pro.deleteOffering(created.id)).then((e) => expect(e.status).toBe(404));
  });

  it('on ne touche pas aux formules ni aux photos d’un autre', async () => {
    const other = mockDb.data.offerings.find(
      (o) => o.providerId !== mockDb.data.providers.find((p) => p.slug === 'saveurs-de-dakar')!.id,
    )!;
    await errorOf(pro.deleteOffering(other.id)).then((e) => expect(e.status).toBe(404));
    const otherMedia = mockDb.data.media.find((m) => m.providerId === other.providerId)!;
    await errorOf(pro.deleteMedia(otherMedia.id)).then((e) => expect(e.status).toBe(404));
  });

  it('supprimer la photo de couverture en choisit une autre', async () => {
    const { profile, media } = await pro.getMyProviderProfile();
    const cover = media.find((m) => m.url === profile.coverUrl);
    if (cover) {
      await pro.deleteMedia(cover.id);
      const after = await pro.getMyProviderProfile();
      expect(after.profile.coverUrl).toBeDefined();
      expect(after.profile.coverUrl).not.toBe(cover.url);
    }
    const added = await pro.addMedia(photo(9));
    expect(added.order).toBeGreaterThan(Math.max(...media.map((m) => m.order)) - 1);
  });

  it('pause puis réactivation d’un profil publié', async () => {
    expect((await pro.setMyProviderProfilePaused(true)).status).toBe('paused');
    // En pause, le profil disparaît de la recherche.
    const search = await newcomer.searchProviders({});
    expect(search.items.some((p) => p.slug === 'saveurs-de-dakar')).toBe(false);
    expect((await pro.setMyProviderProfilePaused(false)).status).toBe('published');

    await newcomer.startProviderOnboarding();
    const draft = await errorOf(newcomer.setMyProviderProfilePaused(true));
    expect(draft).toMatchObject({ status: 409, code: 'invalid_status' });
  });
});
