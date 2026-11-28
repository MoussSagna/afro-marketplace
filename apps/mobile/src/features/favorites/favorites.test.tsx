import { DEMO_CLIENT_ID } from '@afro/common/mocks';
import { act, fireEvent, within } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import FavoritesTab from '../../../app/(tabs)/favoris';
import { useFavoritesStore } from '@/stores/favorites';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { useAuthFlowStore } from '../auth/authFlowStore';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { SearchScreen } from '../search/SearchScreen';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': SearchScreen,
  '(tabs)/favoris': FavoritesTab,
  '(tabs)/evenements': Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
  'prestataires/[slug]/index': Empty,
  'prestataires/[slug]/demande': Empty,
  '(auth)/bienvenue': Empty,
};

/** Des prestataires publiés du jeu de démo, pris dans la recherche (deux catégories différentes). */
async function pick() {
  const { api } = demoApi();
  const food = (await api.searchProviders({ category: 'traiteur-boissons', sort: 'rating' })).items;
  const music = (await api.searchProviders({ category: 'musique-animation', sort: 'rating' }))
    .items;
  return { food: food.slice(0, 2), music: music.slice(0, 1) };
}

async function openFavorites(ids: string[], { signedIn = false } = {}) {
  const ctx = demoApi();
  if (signedIn) {
    const user = ctx.db.data.users.find((u) => u.id === DEMO_CLIENT_ID)!;
    await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  }
  await act(() => useFavoritesStore.setState({ ids }));
  await renderRouter(routes, { initialUrl: '/favoris', wrapper: testProviders(ctx.api) });
  return ctx;
}

const cardOf = (name: string) => screen.findByRole('link', { name: new RegExp(`^${name}, `) });

afterEach(() => {
  useFavoritesStore.getState().clear();
  useTabBarStore.setState({ collapsed: false });
  useSessionStore.setState({ user: null, token: null });
  useAuthFlowStore.setState({ redirectTo: null });
  jest.useRealTimers(); // renderRouter laisse les faux minuteurs actifs
});

describe('Favoris', () => {
  it('sans favori : l’état vide, et « Explorer les prestataires » ramène à la Recherche', async () => {
    await openFavorites([]);
    expect(screen.getByRole('header', { name: 'Favoris' })).toBeOnTheScreen();
    expect(screen.getByText('Pas encore de coup de cœur')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Explorer les prestataires' }));
    expect(screen).toHavePathname('/');
  });

  it('montre les favoris, du plus récent au plus ancien, avec le compteur', async () => {
    const { food, music } = await pick();
    const ids = [music[0]!.id, food[0]!.id, food[1]!.id];
    await openFavorites(ids);
    await cardOf(music[0]!.displayName);
    expect(screen.getByText('3 prestataires gardés')).toBeOnTheScreen();
    // L'ordre des cartes à l'écran (un nom peut contenir une virgule : on compare le début du libellé).
    const shown = screen
      .getAllByRole('link')
      .map((link) => link.props.accessibilityLabel as string)
      .map((label) => [...food, ...music].find((p) => label.startsWith(`${p.displayName}, `))?.id)
      .filter(Boolean);
    expect(shown).toEqual(ids);
    // Chaque carte a son cœur plein (déjà favori) et ses deux actions.
    for (const provider of [...food, ...music]) {
      expect(
        screen.getByRole('button', { name: `Retirer ${provider.displayName} des favoris` }),
      ).toBeSelected();
      expect(
        screen.getByRole('button', { name: `Demander un devis à ${provider.displayName}` }),
      ).toBeOnTheScreen();
      expect(
        screen.getByRole('button', { name: `Ajouter ${provider.displayName} à un événement` }),
      ).toBeOnTheScreen();
    }
  });

  it('le cœur retire le favori de l’écran et du store ; le dernier retiré ramène l’état vide', async () => {
    const { food } = await pick();
    await openFavorites([food[0]!.id, food[1]!.id]);
    await cardOf(food[0]!.displayName);

    await fireEvent.press(
      screen.getByRole('button', { name: `Retirer ${food[0]!.displayName} des favoris` }),
    );
    expect(
      screen.queryByRole('link', { name: new RegExp(`^${food[0]!.displayName}, `) }),
    ).toBeNull();
    expect(useFavoritesStore.getState().ids).toEqual([food[1]!.id]);
    expect(screen.getByText('1 prestataire gardé')).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole('button', { name: `Retirer ${food[1]!.displayName} des favoris` }),
    );
    expect(screen.getByText('Pas encore de coup de cœur')).toBeOnTheScreen();
  });

  it('filtre par catégorie, et « Tous » remet tout', async () => {
    const { food, music } = await pick();
    await openFavorites([food[0]!.id, music[0]!.id, food[1]!.id]);
    await cardOf(food[0]!.displayName);
    const filters = within(screen.getByLabelText('Filtrer tes favoris par catégorie'));
    expect(filters.getByRole('button', { name: 'Tous (3)', selected: true })).toBeOnTheScreen();

    await fireEvent.press(filters.getByRole('button', { name: /^Musique.*\(1\)$/ }));
    expect(await cardOf(music[0]!.displayName)).toBeOnTheScreen();
    expect(
      screen.queryByRole('link', { name: new RegExp(`^${food[0]!.displayName}, `) }),
    ).toBeNull();

    await fireEvent.press(filters.getByRole('button', { name: 'Tous (3)' }));
    expect(await cardOf(food[0]!.displayName)).toBeOnTheScreen();
  });

  it('toucher une carte ouvre la fiche du prestataire', async () => {
    const { food } = await pick();
    await openFavorites([food[0]!.id]);
    await fireEvent.press(await cardOf(food[0]!.displayName));
    expect(screen).toHavePathname(`/prestataires/${food[0]!.slug}`);
  });

  it('« Devis » : la demande de devis si connecté, sinon la connexion d’abord (et retour ensuite)', async () => {
    const { food } = await pick();
    await openFavorites([food[0]!.id]);
    await fireEvent.press(
      await screen.findByRole('button', { name: `Demander un devis à ${food[0]!.displayName}` }),
    );
    expect(screen).toHavePathname('/bienvenue');
    expect(useAuthFlowStore.getState().redirectTo).toBe(`/prestataires/${food[0]!.slug}/demande`);
  });

  it('« Devis » connecté : ouvre la demande de devis du prestataire', async () => {
    const { food } = await pick();
    await openFavorites([food[0]!.id], { signedIn: true });
    await fireEvent.press(
      await screen.findByRole('button', { name: `Demander un devis à ${food[0]!.displayName}` }),
    );
    expect(screen).toHavePathname(`/prestataires/${food[0]!.slug}/demande`);
  });

  it('« Ajouter à un événement » ouvre le panneau des événements, pour ce prestataire', async () => {
    const { food } = await pick();
    await openFavorites([food[0]!.id], { signedIn: true });
    await fireEvent.press(
      await screen.findByRole('button', {
        name: `Ajouter ${food[0]!.displayName} à un événement`,
      }),
    );
    expect(screen.getByRole('header', { name: 'Ajouter à un événement' })).toBeOnTheScreen();
    expect(
      await screen.findByRole('button', { name: /^(Ajouter à|Déjà dans) Anniversaire 30 ans$/ }),
    ).toBeOnTheScreen();
  });
});

describe('Favoris ↔ Recherche (même état)', () => {
  it('un cœur mis dans la Recherche apparaît dans Favoris ; retiré dans Favoris, il se vide dans la Recherche', async () => {
    const { food } = await pick();
    const { api } = demoApi();
    const [first] = (
      await api.searchProviders({ category: 'traiteur-boissons', sort: 'rating', pageSize: 8 })
    ).items;
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(api) });
    const row = within(await screen.findByTestId('home-row-food'));
    await fireEvent.press(
      row.getByRole('button', { name: `Ajouter ${first!.displayName} aux favoris` }),
    );

    await fireEvent.press(screen.getByRole('tab', { name: 'Favoris' }));
    expect(await cardOf(first!.displayName)).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: `Retirer ${first!.displayName} des favoris` }),
    );
    expect(screen.getByText('Pas encore de coup de cœur')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Recherche' }));
    expect(
      within(await screen.findByTestId('home-row-food')).getAllByRole('button', {
        name: `Ajouter ${first!.displayName} aux favoris`,
      }).length,
    ).toBeGreaterThan(0);
    expect(food.length).toBeGreaterThan(0);
  });
});
