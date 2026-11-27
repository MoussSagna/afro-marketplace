import { act, fireEvent } from '@testing-library/react-native';
import EventsTab from '../../../app/(tabs)/evenements';
import FavoritesTab from '../../../app/(tabs)/favoris';
import { Tabs } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { WenzeeSymbolIcon } from '@/components/brand/WenzeeSymbolIcon';
import { demoApi, testProviders } from '@/test/demoApi';
import { ComingSoonScreen } from '../coming-soon/ComingSoonScreen';
import { ClientTabsLayout } from './ClientTabsLayout';
import { GlassTabBar } from './GlassTabBar';
import { useTabBarStore } from './tabBarStore';

const soon = (title: string) =>
  function Screen() {
    return <ComingSoonScreen title={title} lot="—" description={title} />;
  };

const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': soon('Recherche'),
  '(tabs)/favoris': soon('Favoris'),
  '(tabs)/evenements': soon('Événements'),
  '(tabs)/messages': soon('Messages'),
  '(tabs)/compte': soon('Compte'),
};

/** Les tracés (Path) dessinés sous un élément, pour reconnaître une icône. */
function pathsUnder(node: { type: unknown; props: Record<string, unknown>; children: unknown[] }) {
  const found: { props: Record<string, unknown> }[] = [];
  const walk = (n: unknown) => {
    if (!n || typeof n !== 'object') return;
    const element = n as { type: unknown; props: Record<string, unknown>; children: unknown[] };
    if (element.type === 'RNSVGPath') found.push(element);
    element.children?.forEach(walk);
  };
  walk(node);
  return found;
}

/** Le libellé sous l'icône : caché aux lecteurs d'écran, on le cherche donc avec les éléments cachés. */
const label = (routeName: string) =>
  screen.getByTestId(`tab-label-${routeName}`, { includeHiddenElements: true });

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  jest.useRealTimers(); // renderRouter laisse les faux minuteurs actifs
});

describe('Libellés et icônes de la barre d’onglets', () => {
  it('garde l’ordre des onglets, chacun avec son nom sous l’icône', async () => {
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(demoApi().api) });
    const names = screen.getAllByRole('tab').map((tab) => tab.props.accessibilityLabel);
    expect(names).toEqual(['Recherche', 'Favoris', 'Événements', 'Messages', 'Profil']);

    for (const [route, text] of [
      ['index', 'Recherche'],
      ['favoris', 'Favoris'],
      ['evenements', 'Événements'],
      ['messages', 'Messages'],
      ['compte', 'Profil'],
    ] as const) {
      expect(label(route)).toHaveTextContent(text);
      expect(label(route)).toHaveStyle({ opacity: 1 });
    }
  });

  it('onglet actif : pas de cercle, nom en gras et en couleur ; les autres plus grisés', async () => {
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(demoApi().api) });
    // Plus de pastille derrière l'onglet actif.
    expect(screen.getByRole('tab', { name: 'Recherche' })).not.toHaveStyle({
      backgroundColor: expect.anything(),
    });
    expect(label('index')).toHaveStyle({ fontFamily: 'Nunito_700Bold', color: '#7A1F0E' });
    for (const route of ['favoris', 'evenements', 'messages', 'compte']) {
      expect(label(route)).toHaveStyle({ fontFamily: 'Nunito_500Medium', color: '#7D6A5E' });
    }
  });

  it('Favoris et Événements : des écrans vides pour l’instant', async () => {
    await renderRouter(
      { ...routes, '(tabs)/favoris': FavoritesTab, '(tabs)/evenements': EventsTab },
      { initialUrl: '/favoris', wrapper: testProviders(demoApi().api) },
    );
    expect(screen.getByRole('header', { name: 'Favoris' })).toBeOnTheScreen();
    expect(screen.getByText('Bientôt disponible')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Favoris' })).toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: 'Événements' }));
    expect(await screen.findByRole('header', { name: 'Événements' })).toBeOnTheScreen();
    expect(screen).toHavePathname('/evenements');
  });

  it('masque les libellés quand la barre se rétracte, et les remontre quand elle revient', async () => {
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(demoApi().api) });
    await act(() => useTabBarStore.getState().collapse());
    await act(() => jest.advanceTimersByTime(500)); // la durée de l'animation existante (450 ms)
    expect(label('index')).toHaveStyle({ opacity: 0 });
    // L'onglet garde son nom pour les lecteurs d'écran, même libellé masqué.
    expect(screen.getByRole('tab', { name: 'Recherche', hidden: true } as never)).toHaveProp(
      'accessibilityLabel',
      'Recherche',
    );

    await act(() => useTabBarStore.getState().expand());
    await act(() => jest.advanceTimersByTime(500));
    expect(label('index')).toHaveStyle({ opacity: 1 });
    expect(screen.getByRole('tab', { name: 'Recherche' })).toBeOnTheScreen();
  });

  it('montre le symbole Wenzee pour un onglet « evenements » (prêt pour l’écran à venir)', async () => {
    // L'onglet Événements n'existe pas encore : une petite barre de test le déclare, avec la vraie
    // GlassTabBar et sa vraie table d'icônes.
    function EventsTabsLayout() {
      return (
        <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="index" options={{ title: 'Recherche' }} />
          <Tabs.Screen name="evenements" options={{ title: 'Événements' }} />
        </Tabs>
      );
    }
    await renderRouter(
      {
        '(tabs)/_layout': EventsTabsLayout,
        '(tabs)/index': soon('Recherche'),
        '(tabs)/evenements': soon('Événements'),
      },
      { initialUrl: '/', wrapper: testProviders(demoApi().api) },
    );
    expect(screen.getByRole('tab', { name: 'Événements' })).toBeOnTheScreen();
    expect(label('evenements')).toHaveTextContent('Événements');
    const icon = screen.getByTestId('tab-icon-evenements', { includeHiddenElements: true });
    // Le symbole : les 3 tracés du logo (deux arches et le lien), au trait.
    expect(pathsUnder(icon as never)).toHaveLength(3);
  });
});

describe('Icône du symbole Wenzee', () => {
  it('prend la couleur et l’épaisseur données par la barre (rien en dur)', () => {
    // Le composant lu tel quel : Svg > G (trait) > 3 Path.
    const svg = WenzeeSymbolIcon({ size: 24, color: '#F3B618', strokeWidth: 2.4 });
    expect(svg.props).toMatchObject({ width: 24, height: 24 });
    const group = svg.props.children as {
      props: { stroke: string; strokeWidth: number; children: unknown[] };
    };
    expect(group.props.stroke).toBe('#F3B618');
    // 2,4 px à l'écran, ramenés au repère du tracé (210 / 24).
    expect(group.props.strokeWidth).toBeCloseTo(21);
    expect(group.props.children).toHaveLength(3);
  });
});
