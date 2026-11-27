import { type ProviderSearchFilters } from '@afro/common';
import { fireEvent, within } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { todayIso } from '@/lib/dates';
import { useFavoritesStore } from '@/stores/favorites';
import { demoApi, testProviders } from '@/test/demoApi';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { HOME_SECTION_SIZE, homeSections } from './homeSections';
import { SearchScreen } from './SearchScreen';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': SearchScreen,
  '(tabs)/favoris': Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
  'prestataires/[slug]/index': Empty,
};

const TITLES = {
  saturday: 'Libres samedi',
  food: 'Pour régaler tes invités',
  paris: 'Talents à Paris',
  music: 'Pour faire danser la fête',
  smallBudget: 'Petits budgets',
} as const;

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useFavoritesStore.getState().clear();
  jest.useRealTimers(); // renderRouter laisse les faux minuteurs actifs
});

describe('Recherche, état initial : rangées façon Airbnb', () => {
  it('montre chaque rangée avec les prestataires de sa recherche, puis « Comment ça marche »', async () => {
    const { api } = demoApi();
    const sections = homeSections(todayIso());
    // Avant renderRouter (il passe Jest en faux minuteurs) : ce que chaque rangée doit montrer.
    const expected = await Promise.all(
      sections.map((s) => api.searchProviders({ ...s.filters, pageSize: HOME_SECTION_SIZE })),
    );
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });

    for (const [index, section] of sections.entries()) {
      const { items } = expected[index]!;
      expect(items.length).toBeGreaterThan(0); // le jeu de démo remplit chaque rangée
      const row = within(await screen.findByTestId(`home-row-${section.id}`));
      expect(
        row.getByRole('link', { name: `Tout voir : ${TITLES[section.id]}` }),
      ).toBeOnTheScreen();
      for (const provider of items) {
        expect(
          row.getByRole('link', { name: new RegExp(`^${provider.displayName}, `) }),
        ).toBeOnTheScreen();
        expect(
          row.getByRole('button', { name: `Ajouter ${provider.displayName} aux favoris` }),
        ).toBeOnTheScreen();
      }
    }
    expect(screen.getByText('Comment ça marche')).toBeOnTheScreen();
    expect(screen.getByText('2. Demande un devis gratuit')).toBeOnTheScreen();
  });

  it('traiteurs : triés par note, et « Coup de cœur » sur les plus appréciés', async () => {
    const { api } = demoApi();
    const { items } = await api.searchProviders({
      category: 'traiteur-boissons',
      sort: 'rating',
      pageSize: 8,
    });
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    const row = within(await screen.findByTestId('home-row-food'));
    const ratings = items.map((p) => p.ratingAverage);
    expect([...ratings].sort((a, b) => b - a)).toEqual(ratings);
    expect(row.getAllByText('Coup de cœur').length).toBeGreaterThan(0); // Saveurs de Dakar : 4,8 (8 avis)
  });

  it('le titre d’une rangée ouvre les résultats avec ses filtres', async () => {
    const { api } = demoApi();
    const { total } = await api.searchProviders({ city: 'Paris' });
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });

    await fireEvent.press(await screen.findByRole('link', { name: 'Tout voir : Talents à Paris' }));
    expect(screen).toHaveSearchParams({ ville: 'Paris', tri: 'note', vue: 'resultats' });
    expect(await screen.findByTestId('search-state-results')).toBeOnTheScreen();
    expect(
      await screen.findByText(`${total} prestataire${total > 1 ? 's' : ''}`),
    ).toBeOnTheScreen();
  });

  it('« Petits budgets » ouvre les résultats sous 300 €, du moins cher au plus cher', async () => {
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(demoApi().api) });
    await fireEvent.press(await screen.findByRole('link', { name: 'Tout voir : Petits budgets' }));
    expect(screen).toHaveSearchParams({ budget: '300', tri: 'prix-croissant', vue: 'resultats' });
  });

  it('le cœur ajoute aux favoris puis retire, sans ouvrir le profil', async () => {
    const { api } = demoApi();
    const [first] = (
      await api.searchProviders({ category: 'traiteur-boissons', sort: 'rating', pageSize: 8 })
    ).items;
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    const row = within(await screen.findByTestId('home-row-food'));

    await fireEvent.press(
      row.getByRole('button', { name: `Ajouter ${first!.displayName} aux favoris` }),
    );
    expect(useFavoritesStore.getState().ids).toEqual([first!.id]);
    expect(screen).toHavePathname('/');
    // Le même prestataire peut être dans plusieurs rangées : tous ses cœurs passent au plein.
    const remove = screen.getAllByRole('button', {
      name: `Retirer ${first!.displayName} des favoris`,
      selected: true,
    });
    expect(remove.length).toBeGreaterThan(0);

    await fireEvent.press(remove[0]!);
    expect(useFavoritesStore.getState().ids).toEqual([]);
  });

  it('toucher une carte ouvre le profil du prestataire', async () => {
    const { api } = demoApi();
    const [first] = (await api.searchProviders({ city: 'Paris', sort: 'rating', pageSize: 8 }))
      .items;
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    const row = within(await screen.findByTestId('home-row-paris'));
    await fireEvent.press(row.getByRole('link', { name: new RegExp(`^${first!.displayName}, `) }));
    expect(screen).toHavePathname(`/prestataires/${first!.slug}`);
  });

  it('une rangée sans résultat (ou en erreur) disparaît, les autres restent', async () => {
    const { api } = demoApi();
    const searchProviders = (filters: ProviderSearchFilters) => {
      if (filters.city === 'Paris')
        return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 8 });
      if (filters.budgetMax) return Promise.reject(new Error('Serveur indisponible'));
      return api.searchProviders(filters);
    };
    await renderRouter(routes, {
      initialUrl: '/',
      wrapper: testProviders({ ...api, searchProviders }),
    });
    expect(await screen.findByTestId('home-row-saturday')).toBeOnTheScreen();
    expect(await screen.findByTestId('home-row-food')).toBeOnTheScreen();
    expect(await screen.findByTestId('home-row-music')).toBeOnTheScreen();
    expect(screen.queryByTestId('home-row-paris')).toBeNull();
    expect(screen.queryByTestId('home-row-smallBudget')).toBeNull();
    expect(screen.queryByText('Talents à Paris')).toBeNull();
  });
});
