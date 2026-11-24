import type { ProviderSearchFilters } from '@afro/common';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { demoApi, testProviders } from '@/test/demoApi';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { isoDay, longDay } from './searchDates';
import { SearchScreen } from './SearchScreen';
import { BUDGET_LIMIT } from './BudgetSlider';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': Empty,
  '(tabs)/recherche': SearchScreen,
  '(tabs)/demandes': Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
};

/**
 * Ouvre l'onglet Recherche sur une base de démo neuve.
 * `expected` : des recherches à faire AVANT l'affichage (renderRouter passe Jest en faux minuteurs,
 * et un appel direct à l'API ne finirait plus), pour connaître les bons nombres de résultats.
 */
async function open(initialUrl: string, expected: ProviderSearchFilters[] = []) {
  const { db, api } = demoApi();
  const totals = await Promise.all(expected.map(async (f) => (await api.searchProviders(f)).total));
  const spy = jest.spyOn(api, 'searchProviders');
  await renderRouter(routes, { initialUrl, wrapper: testProviders(api) });
  return { db, api, totals, spy };
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const plural = (count: number) => `${count} prestataire${count > 1 ? 's' : ''}`;

/** Le 14 du mois prochain : toujours dans le futur, quel que soit le jour où le test tourne. */
function nextMonth14() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return isoDay(next.getFullYear(), next.getMonth(), 14);
}

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  jest.useRealTimers(); // renderRouter laisse les faux minuteurs actifs
});

describe('Recherche (lot M7)', () => {
  it('charge les prestataires avec le loader, puis les montre en grandes cartes', async () => {
    const { totals } = await open('/recherche', [{}]);
    expect(
      screen.getByRole('progressbar', { name: 'On cherche les meilleurs talents…' }),
    ).toBeOnTheScreen();
    expect(await screen.findByText(plural(totals[0]!))).toBeOnTheScreen();
    expect(screen.queryByRole('progressbar', { name: /On cherche/ })).toBeNull();
    expect(screen.getByRole('search', { name: /^Que cherches-tu \?/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Tout', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Filtres' })).toBeOnTheScreen();
    expect(screen.getAllByLabelText(/, (dès|Sur devis)/).length).toBeGreaterThan(0);
  });

  it('filtre sur une catégorie de la rangée, et la garde dans l’adresse', async () => {
    const { totals } = await open('/recherche', [{}, { category: 'nourriture' }]);
    await screen.findByText(plural(totals[0]!));
    await press('Nourriture');
    expect(screen).toHaveSearchParams({ categorie: 'nourriture' });
    expect(await screen.findByText(plural(totals[1]!))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Nourriture', selected: true })).toBeOnTheScreen();

    await press('Tout');
    expect(await screen.findByText(plural(totals[0]!))).toBeOnTheScreen();
  });

  it('cherche en plein écran : Quoi ? → Où ? → Quand ? → Invités, puis « Rechercher »', async () => {
    const date = nextMonth14();
    const filters = { category: 'nourriture', city: 'Paris', date, guests: 80 };
    const { totals } = await open('/recherche', [filters]);
    await screen.findByRole('button', { name: 'Nourriture' }); // les catégories sont chargées
    await fireEvent.press(screen.getByRole('search', { name: /^Que cherches-tu \?/ }));

    // Étape 1 : Quoi ? Les autres étapes attendent, repliées.
    expect(screen.getByText('Ta recherche')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Que cherches-tu ?' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Où : Partout' })).toBeOnTheScreen();
    // (la rangée de catégories de l'écran est toujours là, derrière : la photo est la dernière trouvée)
    await fireEvent.press(screen.getAllByRole('button', { name: 'Nourriture' }).at(-1)!);

    // Étape 2 : Où ? (le choix précédent est résumé dans l'étape repliée)
    expect(screen.getByRole('header', { name: 'Où ?' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Quoi : Nourriture' })).toBeOnTheScreen();
    expect(
      await screen.findByRole('button', { name: /^Paris, \d+ prestataires?$/ }),
    ).toBeOnTheScreen();
    await press(/^Paris, /);

    // Étape 3 : Quand ? Les jours passés ne se touchent pas.
    expect(screen.getByRole('header', { name: 'Quand ?' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Mois précédent' })).toBeDisabled();
    await press('Mois suivant');
    await press(longDay(date, 'fr-FR'));
    expect(
      screen.getByRole('button', { name: longDay(date, 'fr-FR'), selected: true }),
    ).toBeOnTheScreen();
    await press('Suivant');

    // Étape 4 : Combien d'invités ? De 10 en 10.
    expect(screen.getByRole('header', { name: 'Combien d’invités ?' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Moins d’invités' })).toBeDisabled();
    for (let i = 0; i < 8; i++) await press('Plus d’invités');
    expect(screen.getByRole('adjustable', { name: 'Invités' })).toHaveAccessibilityValue({
      text: '80 invités',
    });

    await press('Rechercher');
    expect(screen).toHaveSearchParams({
      categorie: 'nourriture',
      ville: 'Paris',
      date,
      invites: '80',
    });
    expect(screen.queryByText('Ta recherche')).toBeNull();
    expect(await screen.findByRole('search', { name: /^Nourriture · Paris, / })).toBeOnTheScreen();
    if (totals[0]) {
      expect(await screen.findByText(plural(totals[0]))).toBeOnTheScreen();
      expect(screen.getByText(/libres ce jour-là/)).toBeOnTheScreen();
    } else {
      expect(await screen.findByText('Aucun prestataire pour l’instant')).toBeOnTheScreen();
    }
  });

  it('« Tout effacer » vide la recherche plein écran, la croix la ferme sans rien changer', async () => {
    await open('/recherche?categorie=beaute&ville=Paris');
    await fireEvent.press(await screen.findByRole('search', { name: /^Beauté · Paris/ }));
    expect(screen.getByRole('button', { name: 'Où : Paris' })).toBeOnTheScreen();
    await press('Tout effacer');
    expect(screen.getByRole('button', { name: 'Où : Partout' })).toBeOnTheScreen();
    await press('Fermer');
    expect(screen).toHaveSearchParams({ categorie: 'beaute', ville: 'Paris' });
  });

  it('applique les filtres du panneau, avec le nombre de résultats en direct', async () => {
    const chosen = {
      sort: 'rating' as const,
      verifiedOnly: true,
      budgetMax: BUDGET_LIMIT - 10_000,
    };
    const { totals } = await open('/recherche', [{}, chosen]);
    await screen.findByText(plural(totals[0]!));
    await press('Filtres');

    expect(
      await screen.findByRole('button', { name: `Voir ${plural(totals[0]!)}` }),
    ).toBeOnTheScreen();
    await press('Mieux notés');
    await fireEvent(
      screen.getByRole('switch', { name: 'Profils vérifiés seulement' }),
      'valueChange',
      true,
    );
    const slider = screen.getByRole('adjustable', { name: 'Budget maximum' });
    expect(slider).toHaveAccessibilityValue({ text: 'Sans limite' });
    await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(slider).toHaveAccessibilityValue({ text: /^4\s900\s€$/ });

    const show = await screen.findByRole('button', { name: `Voir ${plural(totals[1]!)}` });
    await fireEvent.press(show);
    expect(screen).toHaveSearchParams({ tri: 'note', verifie: '1', budget: '4900' });
    expect(screen.getByRole('button', { name: 'Filtres, 3 actifs' })).toBeOnTheScreen();
    expect(await screen.findByText('Mieux notés')).toBeOnTheScreen();
  });

  it('montre « Aucun résultat » et propose de retirer les filtres', async () => {
    const { totals } = await open('/recherche?ville=Tombouctou', [{}]);
    expect(await screen.findByText('Aucun prestataire pour l’instant')).toBeOnTheScreen();
    await press('Retirer les filtres');
    expect(screen).toHaveSearchParams({});
    expect(await screen.findByText(plural(totals[0]!))).toBeOnTheScreen();
  });

  it('la flèche de la pilule efface toute la recherche', async () => {
    await open('/recherche?categorie=beaute&date=2099-01-01&note=4');
    await fireEvent.press(await screen.findByRole('button', { name: 'Effacer la recherche' }));
    expect(screen).toHaveSearchParams({});
    expect(await screen.findByRole('search', { name: /^Que cherches-tu \?/ })).toBeOnTheScreen();
  });

  it('charge la page suivante en arrivant en bas de la liste', async () => {
    const { totals, spy } = await open('/recherche', [{}]);
    await screen.findByText(plural(totals[0]!));
    expect(totals[0]!).toBeGreaterThan(12); // plus d'une page de 12
    await act(async () => {
      screen.getByTestId('search-results').props.onEndReached();
    });
    await screen.findByTestId('search-results');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });
});

describe('Dates de la recherche', () => {
  it('écrit les jours dans la langue de l’app', () => {
    expect(longDay('2026-12-14', 'fr-FR')).toBe('lundi 14 décembre 2026');
    expect(longDay('2026-12-14', 'en-GB')).toBe('Monday, 14 December 2026');
  });
});
