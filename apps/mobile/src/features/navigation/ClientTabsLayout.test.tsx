import { seedDemoAccounts } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { ComingSoonScreen } from '../coming-soon/ComingSoonScreen';
import { WelcomeScreen } from '../welcome/WelcomeScreen';
import { ClientTabsLayout } from './ClientTabsLayout';
import { useTabBarStore } from './tabBarStore';

const soon = (title: string, lot: string) =>
  function Screen() {
    return <ComingSoonScreen title={title} lot={lot} description={`Contenu de ${title}`} />;
  };

const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': WelcomeScreen,
  '(tabs)/recherche': soon('Recherche', 'M7'),
  '(tabs)/demandes': soon('Demandes', 'M10'),
  '(tabs)/messages': soon('Messages', 'M10'),
  '(tabs)/compte': soon('Compte', 'M12'),
};

/** Un défilement de l'Accueil jusqu'à la position y. */
const scrollTo = (y: number) =>
  fireEvent.scroll(screen.getByTestId('home-scroll'), { nativeEvent: { contentOffset: { y } } });

afterEach(() => {
  useSessionStore.setState({ user: null, token: null });
  useTabBarStore.setState({ collapsed: false });
  // renderRouter passe Jest en « faux minuteurs » et les laisse : on revient aux vrais.
  jest.useRealTimers();
});

describe('Onglets du mode client (lots M4 et M4 bis)', () => {
  it('ouvre l’Accueil puis passe d’un onglet à l’autre', async () => {
    const { api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    expect(screen.getByText(/Bonjour/)).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Accueil' })).toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: 'Recherche' }));
    expect(await screen.findByRole('header', { name: 'Recherche' })).toBeOnTheScreen();
    expect(screen.getByText('Lot M7')).toBeOnTheScreen();
    expect(screen).toHavePathname('/recherche');
    expect(screen.getByRole('tab', { name: 'Recherche' })).toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: 'Compte' }));
    expect(await screen.findByText('Lot M12')).toBeOnTheScreen();
    expect(screen).toHavePathname('/compte');

    await fireEvent.press(screen.getByRole('tab', { name: 'Accueil' }));
    expect(screen).toHavePathname('/');
  });

  it('se rétracte en rond quand on descend, et revient quand on remonte', async () => {
    const { api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    expect(screen.queryByRole('button', { name: /Afficher les onglets/ })).toBeNull();

    await scrollTo(300);
    expect(
      screen.getByRole('button', { name: 'Afficher les onglets, Accueil actif' }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('tab', { name: 'Recherche' })).toBeNull();

    await scrollTo(200); // on remonte un peu
    expect(screen.getByRole('tab', { name: 'Recherche' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Afficher les onglets/ })).toBeNull();
  });

  it('revient quand on touche le rond', async () => {
    const { api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    await act(() => useTabBarStore.getState().collapse());

    await fireEvent.press(screen.getByRole('button', { name: /Afficher les onglets/ }));
    expect(screen.getByRole('tab', { name: 'Accueil' })).toBeOnTheScreen();
  });

  it('n’affiche que des icônes : les noms restent pour les lecteurs d’écran', async () => {
    const { api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    for (const name of ['Recherche', 'Demandes', 'Messages', 'Compte']) {
      expect(screen.getByRole('tab', { name })).toBeOnTheScreen();
      expect(screen.queryByText(name)).toBeNull();
    }
  });

  it('pas de pastille de non-lus quand personne n’est connecté', async () => {
    const { api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    expect(screen.getByRole('tab', { name: 'Messages' })).toBeOnTheScreen();
  });

  it('affiche les messages non lus de la personne connectée sur l’onglet Messages', async () => {
    const { db, api } = demoApi();
    const client = seedDemoAccounts.find((a) => a.roles.includes('client'))!;
    const user = db.data.users.find((u) => u.id === client.userId)!;
    useSessionStore.getState().signIn({ user, token: `demo:${user.id}` });
    const conversations = await api.listConversations('client');
    const unread = conversations.reduce((total, c) => total + c.unreadCount, 0);
    expect(unread).toBeGreaterThan(0); // le jeu de démo en contient

    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    expect(
      await screen.findByRole('tab', { name: new RegExp(`Messages, ${unread} non lu`) }),
    ).toBeOnTheScreen();
    expect(screen.getByText(String(unread))).toBeOnTheScreen();
  });
});
