import { ApiError, type ApiClient } from '@afro/common';
import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { mainCategories } from '@/lib/categories';
import { demoApi, testProviders } from '@/test/demoApi';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { SearchScreen } from '../search/SearchScreen';
import { CATEGORY_ICONS } from './categoryIcons';
import { HomeScreen } from './HomeScreen';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': HomeScreen,
  '(tabs)/recherche': SearchScreen,
  '(tabs)/demandes': Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
};

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  jest.useRealTimers(); // renderRouter laisse les faux minuteurs actifs
});

describe('Accueil (lot M6)', () => {
  it('affiche la bannière, puis les catégories principales et les prestataires à la une', async () => {
    const { db, api } = demoApi();
    // Avant renderRouter : il passe Jest en faux minuteurs, et l'appel direct ne finirait jamais.
    const featured = await api.listFeaturedProviders();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });

    expect(
      screen.getByRole('header', { name: 'Des talents qui font vivre nos cultures' }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('search', { name: 'Rechercher un prestataire' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Chargement des catégories')).toBeOnTheScreen();

    const main = mainCategories(db.data.categories);
    expect(main).toHaveLength(5);
    for (const category of main) {
      expect(await screen.findByRole('button', { name: category.name })).toBeOnTheScreen();
      expect(CATEGORY_ICONS[category.slug]).toBeDefined(); // chaque catégorie a son icône
    }
    // Les sous-catégories (Traiteur…) n'y sont pas.
    expect(screen.queryByRole('button', { name: 'Traiteur' })).toBeNull();

    expect(await screen.findByText(featured[0]!.displayName)).toBeOnTheScreen();
    expect(screen.queryByLabelText('Chargement des catégories')).toBeNull();
  });

  it('montre le prix « dès … » ou « Sur devis » sur les cartes', async () => {
    const { api } = demoApi();
    const featured = await api.listFeaturedProviders();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    const withPrice = featured.find((p) => p.priceFrom !== undefined)!;
    expect(
      await screen.findByLabelText(new RegExp(`^${withPrice.displayName}, .*, dès `)),
    ).toBeOnTheScreen();
  });

  it('affiche une erreur sur les catégories, puis réessaie avec succès', async () => {
    const { db, api } = demoApi();
    const listCategories = jest
      .fn<ReturnType<ApiClient['listCategories']>, []>()
      .mockRejectedValueOnce(new ApiError(500, 'Serveur indisponible'))
      .mockImplementation(() => api.listCategories());
    await renderRouter(routes, {
      initialUrl: '/',
      wrapper: testProviders({ ...api, listCategories }),
    });

    expect(await screen.findByText('Oups, ça n’a pas chargé')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
    const first = mainCategories(db.data.categories)[0]!;
    expect(await screen.findByRole('button', { name: first.name })).toBeOnTheScreen();
  });

  it('toucher une catégorie ouvre la Recherche filtrée sur elle', async () => {
    const { db, api } = demoApi();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    const beauty = db.data.categories.find((c) => c.slug === 'beaute')!;

    await fireEvent.press(await screen.findByRole('button', { name: beauty.name }));
    expect(screen).toHavePathname('/recherche');
    expect(screen).toHaveSearchParams({ categorie: 'beaute' });
    expect(await screen.findByText(`Catégorie : ${beauty.name}`)).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Recherche' })).toBeSelected();
  });

  it('toucher la barre de recherche ouvre la Recherche', async () => {
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(demoApi().api) });
    await fireEvent.press(screen.getByRole('search', { name: 'Rechercher un prestataire' }));
    expect(screen).toHavePathname('/recherche');
    expect(screen.queryByText(/Catégorie :/)).toBeNull();
  });
});
