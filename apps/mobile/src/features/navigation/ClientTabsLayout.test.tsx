import { seedDemoAccounts } from '@afro/common/mocks';
import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { ComingSoonScreen } from '../coming-soon/ComingSoonScreen';
import { WelcomeScreen } from '../welcome/WelcomeScreen';
import { ClientTabsLayout } from './ClientTabsLayout';

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

afterEach(() => {
  useSessionStore.setState({ user: null, token: null });
  // renderRouter passe Jest en « faux minuteurs » et les laisse : on revient aux vrais.
  jest.useRealTimers();
});

describe('Onglets du mode client (lot M4)', () => {
  it('ouvre l’Accueil puis passe d’un onglet à l’autre', async () => {
    const { api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    expect(screen.getByText(/Bonjour/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: /Recherche/ }));
    expect(await screen.findByRole('header', { name: 'Recherche' })).toBeOnTheScreen();
    expect(screen.getByText('Lot M7')).toBeOnTheScreen();
    expect(screen).toHavePathname('/recherche');

    await fireEvent.press(screen.getByRole('button', { name: /Compte/ }));
    expect(await screen.findByText('Lot M12')).toBeOnTheScreen();
    expect(screen).toHavePathname('/compte');

    await fireEvent.press(screen.getByRole('button', { name: /Accueil/ }));
    expect(screen).toHavePathname('/');
  });

  it('pas de pastille de non-lus quand personne n’est connecté', async () => {
    const { api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    expect(screen.getByRole('button', { name: 'Messages' })).toBeOnTheScreen();
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
      await screen.findByRole('button', { name: new RegExp(`Messages, ${unread} non lu`) }),
    ).toBeOnTheScreen();
  });
});
