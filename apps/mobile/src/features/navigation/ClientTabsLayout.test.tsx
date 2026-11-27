import { seedDemoAccounts } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { ComingSoonScreen } from '../coming-soon/ComingSoonScreen';
import { SearchScreen } from '../search/SearchScreen';
import { ClientTabsLayout } from './ClientTabsLayout';
import { useTabBarStore } from './tabBarStore';

const soon = (title: string, lot: string) =>
  function Screen() {
    return <ComingSoonScreen title={title} lot={lot} description={`Contenu de ${title}`} />;
  };

const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': SearchScreen,
  '(tabs)/demandes': soon('Demandes', 'M10'),
  '(tabs)/messages': soon('Messages', 'M10'),
  '(tabs)/compte': soon('Compte', 'M12'),
};

/** Un défilement de la Recherche (état initial) jusqu'à la position y. */
const scrollTo = (y: number) =>
  fireEvent.scroll(screen.getByTestId('search-home'), { nativeEvent: { contentOffset: { y } } });

afterEach(() => {
  useSessionStore.setState({ user: null, token: null });
  useTabBarStore.setState({ collapsed: false });
  // renderRouter passe Jest en « faux minuteurs » et les laisse : on revient aux vrais.
  jest.useRealTimers();
});

describe('Onglets du mode client (lots M4 et M4 bis)', () => {
  it('ouvre la Recherche (4 onglets, plus d’Accueil) puis passe d’un onglet à l’autre', async () => {
    const { api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    expect(screen.getByTestId('search-state-home')).toBeOnTheScreen();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveProp('accessibilityLabel', 'Recherche');
    expect(screen.getByRole('tab', { name: 'Recherche' })).toBeSelected();
    expect(screen.queryByRole('tab', { name: 'Accueil' })).toBeNull();

    await fireEvent.press(screen.getByRole('tab', { name: 'Compte' }));
    expect(await screen.findByText('Lot M12')).toBeOnTheScreen();
    expect(screen).toHavePathname('/compte');

    await fireEvent.press(screen.getByRole('tab', { name: 'Recherche' }));
    expect(screen).toHavePathname('/');
    expect(screen.getByRole('tab', { name: 'Recherche' })).toBeSelected();
  });

  it('se rétracte en rond quand on descend, et revient quand on remonte', async () => {
    const { api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    expect(screen.queryByRole('button', { name: /Afficher les onglets/ })).toBeNull();

    await scrollTo(300);
    expect(
      screen.getByRole('button', { name: 'Afficher les onglets, Recherche actif' }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('tab', { name: 'Demandes' })).toBeNull();

    await scrollTo(200); // on remonte un peu
    expect(screen.getByRole('tab', { name: 'Demandes' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Afficher les onglets/ })).toBeNull();
  });

  it('revient quand on touche le rond', async () => {
    const { api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    await act(() => useTabBarStore.getState().collapse());

    await fireEvent.press(screen.getByRole('button', { name: /Afficher les onglets/ }));
    expect(screen.getByRole('tab', { name: 'Recherche' })).toBeOnTheScreen();
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
