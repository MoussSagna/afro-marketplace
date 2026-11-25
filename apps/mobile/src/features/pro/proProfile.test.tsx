import { DEMO_PROVIDER_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Linking } from 'react-native';
import ProReviewsRoute from '../../../app/pro/avis';
import ProProfileTab from '../../../app/pro/(tabs)/profil';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { useTabBarStore } from '../navigation/tabBarStore';
import { ProTabsLayout } from './ProTabsLayout';

const Empty = () => null;
const routes = {
  'pro/(tabs)/_layout': ProTabsLayout,
  'pro/(tabs)/index': Empty,
  'pro/(tabs)/demandes': Empty,
  'pro/(tabs)/messages': Empty,
  'pro/(tabs)/agenda': Empty,
  'pro/(tabs)/profil': ProProfileTab,
  'pro/avis': ProReviewsRoute,
};

async function open(initialUrl: string) {
  const ctx = demoApi();
  const user = ctx.db.data.users.find((u) => u.id === DEMO_PROVIDER_ID)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  await renderRouter(routes, { initialUrl, wrapper: testProviders(ctx.api) });
  return ctx;
}

const providerOf = (db: MockDb) => db.data.providers.find((p) => p.userId === DEMO_PROVIDER_ID)!;
const reviewsOf = (db: MockDb) =>
  db.data.reviews.filter((r) => r.providerId === providerOf(db).id && r.status === 'published');

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useSessionStore.setState({ user: null, token: null });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Profil pro (lot M15b)', () => {
  it('montre l’aperçu de la carte, l’état et les sections', async () => {
    const { db } = await open('/pro/profil');
    const provider = providerOf(db);
    expect(await screen.findByText(provider.displayName)).toBeOnTheScreen();
    expect(screen.getByText('En ligne')).toBeOnTheScreen();
    const unanswered = reviewsOf(db).filter((r) => !r.providerReply).length;
    expect(
      screen.getByRole('button', { name: `Avis reçus, ${unanswered} sans réponse` }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Voir ma page publique' })).toBeOnTheScreen();
  });

  it('les photos se modifient encore sur le site : la ligne ouvre la bonne page', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await open('/pro/profil');
    expect(
      await screen.findByRole('button', { name: /^Formules et prix, \d+$/ }),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('link', { name: /^Photos, \d+, sur le site$/ }));
    expect(openURL).toHaveBeenCalledWith('https://wenzee.example/pro/profil');
  });

  it('met le profil en pause, puis le réactive', async () => {
    const { db } = await open('/pro/profil');
    const visible = await screen.findByLabelText('Profil visible');

    await fireEvent(visible, 'valueChange', false);
    expect(await screen.findByText(/^Ton profil est en pause/)).toBeOnTheScreen();
    expect(providerOf(db).status).toBe('paused');
    expect(screen.queryByRole('button', { name: 'Voir ma page publique' })).toBeNull();

    await fireEvent(screen.getByLabelText('Profil visible'), 'valueChange', true);
    expect(await screen.findByText('En ligne')).toBeOnTheScreen();
    expect(providerOf(db).status).toBe('published');
  });

  it('répond à un avis : réponse obligatoire, puis publiée une seule fois', async () => {
    const { db } = await open('/pro/profil');
    await fireEvent.press(await screen.findByRole('button', { name: /^Avis reçus/ }));
    expect(screen).toHavePathname('/pro/avis');

    const before = reviewsOf(db).filter((r) => !r.providerReply).length;
    const firstInput = () => screen.getAllByLabelText(/^Répondre à /)[0]!;
    const firstPublish = () =>
      fireEvent.press(screen.getAllByRole('button', { name: 'Publier la réponse' })[0]!);
    expect(await screen.findAllByLabelText(/^Répondre à /)).toHaveLength(before);

    await firstPublish();
    expect(screen.getByText('La réponse est vide')).toBeOnTheScreen();

    await fireEvent.changeText(firstInput(), 'Merci beaucoup, au plaisir !');
    await firstPublish();
    expect(await screen.findByText('Merci beaucoup, au plaisir !')).toBeOnTheScreen();
    expect(screen.queryAllByLabelText(/^Répondre à /)).toHaveLength(before - 1);
    expect(
      db.data.reviews.filter((r) => r.providerReply === 'Merci beaucoup, au plaisir !'),
    ).toHaveLength(1);
  });
});
