import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, createHttpApiClient } from '../../api';
import { handlers, mockDb } from '..';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockDb.reset());
afterAll(() => server.close());

const as = (userId: string) => createHttpApiClient({ getToken: () => `demo:${userId}` });
const admin = as('user-admin');
const visitor = createHttpApiClient();

async function errorOf(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

const lastAction = () => mockDb.data.moderationActions.at(-1)!;

describe('Admin : accès', () => {
  it('réservé aux admins', async () => {
    expect((await errorOf(as('user-aissatou').listReports())).status).toBe(403);
    expect((await errorOf(visitor.getAdminOverview())).status).toBe(401);
  });

  it('vue d’ensemble : les compteurs', async () => {
    const overview = await admin.getAdminOverview();
    expect(overview.providersToReview).toBeGreaterThan(0);
    expect(overview.openReports).toBeGreaterThan(0);
  });
});

describe('A2 : profils à valider', () => {
  it('valider publie le profil, qui apparaît dans la recherche ; journal écrit', async () => {
    const [pending] = await admin.listProvidersToReview();
    expect(pending!.slug).toBe('kompa-vibes-haiti');
    const fiche = await admin.getAdminProvider(pending!.id);
    expect(fiche.owner.id).toBe(pending!.userId);

    const before = await visitor.searchProviders({ q: 'Kompa' });
    expect(before.items.some((p) => p.id === pending!.id)).toBe(false);

    const published = await admin.moderateProvider(pending!.id, {
      decision: 'validate',
      isProVerified: false,
    });
    expect(published.status).toBe('published');
    expect(lastAction()).toMatchObject({ action: 'validate_profile', targetId: pending!.id });

    const after = await visitor.searchProviders({ q: 'Kompa' });
    expect(after.items.some((p) => p.id === pending!.id)).toBe(true);

    const twice = await errorOf(
      admin.moderateProvider(pending!.id, { decision: 'validate', isProVerified: false }),
    );
    expect(twice).toMatchObject({ status: 409, code: 'invalid_status' });
  });

  it('demander des corrections exige un motif et le transmet au prestataire', async () => {
    const [pending] = await admin.listProvidersToReview();
    const short = await errorOf(
      admin.moderateProvider(pending!.id, { decision: 'request_changes', reason: 'Non' }),
    );
    expect(short.status).toBe(400);
    const reason = 'Merci d’ajouter des photos de vos prestations.';
    const updated = await admin.moderateProvider(pending!.id, {
      decision: 'request_changes',
      reason,
    });
    expect(updated).toMatchObject({ status: 'changes_requested', rejectionReason: reason });
    expect(lastAction()).toMatchObject({ action: 'request_changes', note: reason });
  });
});

describe('A3 : signalements', () => {
  it('liste les signalements ouverts avec un aperçu de la cible', async () => {
    const reports = await admin.listReports('open');
    expect(reports.length).toBeGreaterThan(0);
    expect(reports.every((r) => r.status === 'open')).toBe(true);
    const review = reports.find((r) => r.targetType === 'review')!;
    expect(review.target.label).toMatch(/^Avis de /);
    expect(review.target.hidden).toBe(false);
  });

  it('masquer un avis : il disparaît du profil et la note est recalculée', async () => {
    const report = (await admin.listReports('open')).find((r) => r.targetType === 'review')!;
    const review = mockDb.data.reviews.find((r) => r.id === report.targetId)!;
    const countBefore = mockDb.data.providers.find((p) => p.id === review.providerId)!.ratingCount;

    const resolved = await admin.resolveReport(report.id, { outcome: 'hide_content' });
    expect(resolved.status).toBe('resolved');
    expect(review.status).toBe('hidden');
    expect(mockDb.data.providers.find((p) => p.id === review.providerId)!.ratingCount).toBe(
      countBefore - 1,
    );
    const publicReviews = await visitor.listProviderReviews(review.providerId);
    expect(publicReviews.some((r) => r.id === review.id)).toBe(false);
    expect(lastAction()).toMatchObject({ action: 'hide_content', targetType: 'review' });

    const again = await errorOf(admin.resolveReport(report.id, { outcome: 'dismiss' }));
    expect(again.status).toBe(409);
  });

  it('suspendre l’auteur : il ne peut plus se connecter et son profil sort de la recherche', async () => {
    const report = (await admin.listReports('open')).find((r) => r.targetType === 'provider')!;
    const provider = mockDb.data.providers.find((p) => p.id === report.targetId)!;
    await admin.resolveReport(report.id, { outcome: 'suspend_user', note: 'Fraude avérée' });

    const owner = mockDb.data.users.find((u) => u.id === provider.userId)!;
    expect(owner.status).toBe('suspended');
    expect(provider.status).toBe('suspended');
    expect((await errorOf(visitor.signInAsDemo(owner.id))).status).toBe(403);
    expect(lastAction()).toMatchObject({ action: 'suspend_user', targetId: owner.id });
  });

  it('classer sans suite', async () => {
    const [report] = await admin.listReports('open');
    expect((await admin.resolveReport(report!.id, { outcome: 'dismiss' })).status).toBe(
      'dismissed',
    );
    expect(lastAction()).toMatchObject({ action: 'dismiss_report', targetId: report!.id });
  });
});

describe('A4 : utilisateurs', () => {
  it('recherche sans tenir compte des accents ni de la casse', async () => {
    const result = await admin.listUsers({ q: 'aissatou' });
    expect(result.items.map((u) => u.id)).toContain('user-aissatou');
    expect((await admin.listUsers({})).total).toBe(
      mockDb.data.users.filter((u) => u.status !== 'deleted').length,
    );
  });

  it('suspend puis réactive un compte, avec motif obligatoire', async () => {
    const missing = await errorOf(
      admin.setUserStatus('user-saveurs-de-dakar', { status: 'suspended', note: '' }),
    );
    expect(missing.status).toBe(400);

    await admin.setUserStatus('user-saveurs-de-dakar', { status: 'suspended', note: 'Test' });
    const saveurs = () => mockDb.data.providers.find((p) => p.slug === 'saveurs-de-dakar')!;
    expect(saveurs().status).toBe('suspended');

    const user = await admin.setUserStatus('user-saveurs-de-dakar', {
      status: 'active',
      note: 'Erreur corrigée',
    });
    expect(user.status).toBe('active');
    expect(saveurs().status).toBe('published');
    expect(lastAction()).toMatchObject({ action: 'reactivate_user' });
  });

  it('pas de suspension d’un admin', async () => {
    const error = await errorOf(
      admin.setUserStatus('user-admin', { status: 'suspended', note: 'Test' }),
    );
    expect(error.status).toBe(422);
  });
});
