import { ApiError, type ApiClient } from '@afro/common';
import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { mainCategories } from '@/lib/categories';
import { demoApi, testProviders } from '@/test/demoApi';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { CATEGORY_ICONS } from './categoryIcons';
import { SearchScreen } from './SearchScreen';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': SearchScreen,
  demandes: Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
};

const plural = (count: number) => `${count} prestataire${count > 1 ? 's' : ''}`;
const pill = () => screen.getByRole('search', { name: /^Que cherches-tu \?/ });

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  jest.useRealTimers(); // renderRouter laisse les faux minuteurs actifs
});

describe('Recherche, état initial (ancien Accueil, lot M6)', () => {
  it('ouvre l’app sur la pilule, « À la une » en grand et les catégories principales', async () => {
    const { db, api } = demoApi();
    // Avant renderRouter : il passe Jest en faux minuteurs, et l'appel direct ne finirait jamais.
    const featured = await api.listFeaturedProviders();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });

    expect(screen.getByTestId('search-state-home')).toBeOnTheScreen();
    expect(pill()).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Recherche' })).toBeSelected();
    // Pas encore de résultats ni de rangée de catégories (« Tout »), ni de bouton pour effacer.
    expect(screen.queryByTestId('search-results')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tout' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Effacer la recherche' })).toBeNull();

    const main = mainCategories(db.data.categories);
    expect(main).toHaveLength(8);
    for (const category of main) {
      expect(await screen.findByRole('button', { name: category.name })).toBeOnTheScreen();
      expect(CATEGORY_ICONS[category.slug]).toBeDefined(); // chaque catégorie a son icône
    }
    // Les sous-catégories (Traiteurs…) n'y sont pas.
    expect(screen.queryByRole('button', { name: 'Traiteurs' })).toBeNull();

    // Le carrousel : une page par prestataire à la une, et un point par page.
    expect(await screen.findByTestId('featured-list')).toBeOnTheScreen();
    for (const provider of featured) {
      expect(
        screen.getByRole('link', { name: new RegExp(`^${provider.displayName}, `) }),
      ).toBeOnTheScreen();
    }
    expect(screen.getAllByText('Prestataire à la une')).toHaveLength(featured.length);
  });

  it('montre le prix « dès … » ou « Sur devis » et la note sur chaque page', async () => {
    const { api } = demoApi();
    const featured = await api.listFeaturedProviders();
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    const withPrice = featured.find((p) => p.priceFrom !== undefined)!;
    expect(
      await screen.findByLabelText(new RegExp(`^${withPrice.displayName}, .*, dès `)),
    ).toBeOnTheScreen();
    const rated = featured.find((p) => p.ratingCount > 0)!;
    expect(
      screen.getByLabelText(new RegExp(`^${rated.displayName}, .*${rated.ratingCount} avis`)),
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
      // « À la une » reste en chargement : ses pages relisent les catégories et relanceraient la requête.
      wrapper: testProviders({
        ...api,
        listCategories,
        listFeaturedProviders: () => new Promise(() => {}),
      }),
    });

    expect(await screen.findByText('Oups, ça n’a pas chargé')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
    const first = mainCategories(db.data.categories)[0]!;
    expect(await screen.findByRole('button', { name: first.name })).toBeOnTheScreen();
  });
});

describe('Recherche : passage aux résultats et retour', () => {
  it('toucher une catégorie montre les résultats filtrés sur elle', async () => {
    const { db, api } = demoApi();
    const { total } = await api.searchProviders({ category: 'beaute-soins' });
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    const beauty = db.data.categories.find((c) => c.slug === 'beaute-soins')!;

    await fireEvent.press(await screen.findByRole('button', { name: beauty.name }));
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSearchParams({ categorie: 'beaute-soins', vue: 'resultats' });
    expect(await screen.findByTestId('search-state-results')).toBeOnTheScreen();
    // La rangée de catégories a la catégorie déjà choisie.
    expect(
      await screen.findByRole('button', { name: beauty.name, selected: true }),
    ).toBeOnTheScreen();
    expect(await screen.findByText(plural(total))).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Recherche' })).toBeSelected();
  });

  it('« Tout voir » montre tous les prestataires, et « Tout » garde les résultats', async () => {
    const { api } = demoApi();
    const { total } = await api.searchProviders({});
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });

    await fireEvent.press(
      await screen.findByRole('link', { name: 'Tout voir : Explore nos catégories' }),
    );
    expect(screen).toHaveSearchParams({ vue: 'resultats' });
    expect(await screen.findByText(plural(total))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Tout', selected: true })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Tout' }));
    expect(screen.getByTestId('search-state-results')).toBeOnTheScreen();
  });

  it('effacer la recherche revient à l’état initial', async () => {
    await renderRouter(routes, {
      initialUrl: '/?categorie=beaute-soins&ville=Paris',
      wrapper: testProviders(demoApi().api),
    });
    expect(screen.getByTestId('search-state-results')).toBeOnTheScreen();

    await fireEvent.press(await screen.findByRole('button', { name: 'Effacer la recherche' }));
    expect(screen).toHaveSearchParams({});
    expect(await screen.findByTestId('search-state-home')).toBeOnTheScreen();
    expect(pill()).toBeOnTheScreen();
  });

  it('toucher l’onglet Recherche quand on y est déjà revient à l’état initial', async () => {
    await renderRouter(routes, {
      initialUrl: '/?vue=resultats',
      wrapper: testProviders(demoApi().api),
    });
    expect(screen.getByTestId('search-state-results')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Recherche' }));
    expect(await screen.findByTestId('search-state-home')).toBeOnTheScreen();
    expect(screen).toHaveSearchParams({});
  });

  it('valider une recherche vide revient à l’état initial', async () => {
    await renderRouter(routes, {
      initialUrl: '/?categorie=beaute-soins',
      wrapper: testProviders(demoApi().api),
    });
    await fireEvent.press(await screen.findByRole('search', { name: /^Beauté & soins/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Tout effacer' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Rechercher' }));

    expect(await screen.findByTestId('search-state-home')).toBeOnTheScreen();
    expect(screen).toHaveSearchParams({});
  });

  it('une adresse avec des filtres ouvre directement les résultats', async () => {
    await renderRouter(routes, {
      initialUrl: '/?ville=Paris',
      wrapper: testProviders(demoApi().api),
    });
    expect(screen.getByTestId('search-state-results')).toBeOnTheScreen();
    expect(screen.getByRole('search', { name: /^Tout · Paris/ })).toBeOnTheScreen();
  });
});
