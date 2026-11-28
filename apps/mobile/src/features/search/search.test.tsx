import type { ProviderSearchFilters } from '@afro/common';
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { demoApi, testProviders } from '@/test/demoApi';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { isoDay, longDay } from '@/lib/dates';
import { SearchScreen } from './SearchScreen';
import { BUDGET_LIMIT } from './BudgetSlider';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': SearchScreen,
  demandes: Empty,
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
    const { totals } = await open('/?vue=resultats', [{}]);
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
    const { totals } = await open('/?vue=resultats', [{}, { category: 'traiteur-boissons' }]);
    await screen.findByText(plural(totals[0]!));
    await press('Traiteur & boissons');
    expect(screen).toHaveSearchParams({ categorie: 'traiteur-boissons', vue: 'resultats' });
    expect(await screen.findByText(plural(totals[1]!))).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Traiteur & boissons', selected: true }),
    ).toBeOnTheScreen();

    await press('Tout');
    expect(await screen.findByText(plural(totals[0]!))).toBeOnTheScreen();
  });

  it('cherche en plein écran : Quoi ? → Où ? → Quand ? → Invités, puis « Rechercher »', async () => {
    const date = nextMonth14();
    const filters = { category: 'traiteur-boissons', city: 'Paris', date, guests: 80 };
    const { totals } = await open('/?vue=resultats', [filters]);
    await screen.findByRole('button', { name: 'Traiteur & boissons' }); // les catégories sont chargées
    await fireEvent.press(screen.getByRole('search', { name: /^Que cherches-tu \?/ }));

    // Étape 1 : Quoi ? Les autres étapes attendent, repliées.
    expect(screen.getByText('Ta recherche')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Que cherches-tu ?' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Où : Partout' })).toBeOnTheScreen();
    // Les groupes sans photo (Photo & vidéo…) montrent leur icône à la place.
    expect(screen.getByTestId('category-icon-photo-video')).toBeOnTheScreen();
    // (la rangée de catégories de l'écran est toujours là, derrière : la photo est la dernière trouvée)
    await fireEvent.press(screen.getAllByRole('button', { name: 'Traiteur & boissons' }).at(-1)!);

    // Étape 2 : Où ? (le choix précédent est résumé dans l'étape repliée)
    expect(screen.getByRole('header', { name: 'Où ?' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Quoi : Traiteur & boissons' })).toBeOnTheScreen();
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

    // Étape 4 : Combien d'invités ? Un champ numérique (plus de boutons − / +).
    expect(screen.getByRole('header', { name: 'Combien d’invités ?' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Plus d’invités' })).toBeNull();
    await fireEvent.changeText(screen.getByLabelText('Nombre d’invités'), '80');
    expect(screen.getByLabelText('Nombre d’invités')).toHaveProp('value', '80');

    await press('Rechercher');
    expect(screen).toHaveSearchParams({
      categorie: 'traiteur-boissons',
      ville: 'Paris',
      date,
      invites: '80',
      vue: 'resultats',
    });
    expect(screen.queryByText('Ta recherche')).toBeNull();
    expect(
      await screen.findByRole('search', { name: /^Traiteur & boissons · Paris, / }),
    ).toBeOnTheScreen();
    if (totals[0]) {
      expect(await screen.findByText(plural(totals[0]))).toBeOnTheScreen();
      expect(screen.getByText(/libres ce jour-là/)).toBeOnTheScreen();
    } else {
      expect(await screen.findByText('Aucun prestataire pour l’instant')).toBeOnTheScreen();
    }
  });

  it('« Tout effacer » vide la recherche plein écran, la croix la ferme sans rien changer', async () => {
    await open('/?categorie=beaute-soins&ville=Paris');
    await fireEvent.press(await screen.findByRole('search', { name: /^Beauté & soins · Paris/ }));
    expect(screen.getByRole('button', { name: 'Où : Paris' })).toBeOnTheScreen();
    await press('Tout effacer');
    expect(screen.getByRole('button', { name: 'Où : Partout' })).toBeOnTheScreen();
    await press('Fermer');
    expect(screen).toHaveSearchParams({ categorie: 'beaute-soins', ville: 'Paris' });
  });

  it('applique les filtres du panneau, avec le nombre de résultats en direct', async () => {
    const chosen = {
      sort: 'rating' as const,
      verifiedOnly: true,
      budgetMax: BUDGET_LIMIT - 10_000,
    };
    const { totals } = await open('/?vue=resultats', [{}, chosen]);
    await screen.findByText(plural(totals[0]!));
    await press('Filtres');

    // Le panneau (bottom sheet) : une ligne par filtre, le nombre de résultats en bas.
    expect(
      await screen.findByRole('button', { name: `Afficher ${plural(totals[0]!)}` }),
    ).toBeOnTheScreen();
    await press('Trier par, Pertinence');
    await fireEvent.press(screen.getByRole('radio', { name: 'Mieux notés' }));
    await press('Valider');
    await fireEvent(
      screen.getByRole('switch', { name: 'Vérifiés uniquement' }),
      'valueChange',
      true,
    );
    await press('Budget, Toutes les tranches');
    const slider = screen.getByRole('adjustable', { name: 'Budget maximum' });
    expect(slider).toHaveAccessibilityValue({ text: 'Sans limite' });
    await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(slider).toHaveAccessibilityValue({ text: /^4\s900\s€$/ });
    await press('Valider');

    const show = await screen.findByRole('button', { name: `Afficher ${plural(totals[1]!)}` });
    await fireEvent.press(show);
    expect(screen).toHaveSearchParams({
      tri: 'note',
      verifie: '1',
      budget: '4900',
      vue: 'resultats',
    });
    expect(screen.getByRole('button', { name: 'Filtres, 3 actifs' })).toBeOnTheScreen();
    expect(await screen.findByText('Mieux notés')).toBeOnTheScreen();
  });

  it('montre « Aucun résultat » et propose de retirer les filtres', async () => {
    const { totals } = await open('/?ville=Tombouctou', [{}]);
    expect(await screen.findByText('Aucun prestataire pour l’instant')).toBeOnTheScreen();
    await press('Retirer les filtres');
    // On reste sur les résultats, sans filtre.
    expect(screen).toHaveSearchParams({ vue: 'resultats' });
    expect(await screen.findByText(plural(totals[0]!))).toBeOnTheScreen();
  });

  it('la flèche de la pilule efface toute la recherche et revient à l’état initial', async () => {
    await open('/?categorie=beaute-soins&date=2099-01-01&note=4');
    await fireEvent.press(await screen.findByRole('button', { name: 'Effacer la recherche' }));
    expect(screen).toHaveSearchParams({});
    expect(await screen.findByRole('search', { name: /^Que cherches-tu \?/ })).toBeOnTheScreen();
    expect(screen.getByTestId('search-state-home')).toBeOnTheScreen();
  });

  it('charge la page suivante en arrivant en bas de la liste', async () => {
    const { totals, spy } = await open('/?vue=resultats', [{}]);
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

describe('Ta recherche : champ des invités et pied de page', () => {
  /** Ouvre la recherche plein écran et va jusqu'à l'étape des invités. */
  async function openGuests() {
    await open('/?vue=resultats');
    await fireEvent.press(await screen.findByRole('search', { name: /^Que cherches-tu \?/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Invités : / }));
    return screen.getByLabelText('Nombre d’invités');
  }

  it('n’accepte que des chiffres, garde le champ vide pendant la saisie, plafonne à 1 000', async () => {
    const input = await openGuests();
    expect(input).toHaveProp('keyboardType', 'number-pad');
    expect(input).toHaveProp('placeholder', '0');
    expect(screen.getByText('Indique le nombre d’invités (estimation)')).toBeOnTheScreen();

    await fireEvent.changeText(input, '12a-3');
    expect(input).toHaveProp('value', '123');
    await fireEvent.changeText(input, '');
    expect(input).toHaveProp('value', '');
    await fireEvent.changeText(input, '007');
    expect(input).toHaveProp('value', '7');
    await fireEvent.changeText(input, '9999');
    expect(input).toHaveProp('value', '1000');
  });

  it('la valeur est gardée d’une étape à l’autre, puis envoyée à la recherche', async () => {
    const input = await openGuests();
    await fireEvent.changeText(input, '150');
    await fireEvent.press(screen.getByRole('button', { name: /^Où : / }));
    expect(screen.getByRole('button', { name: 'Invités : 150 invités' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Rechercher' }));
    expect(screen).toHaveSearchParams({ invites: '150', vue: 'resultats' });
  });

  it('0 ou vide : pas de filtre d’invités', async () => {
    const input = await openGuests();
    await fireEvent.changeText(input, '0');
    await fireEvent.press(screen.getByRole('button', { name: 'Rechercher' }));
    expect(screen).toHaveSearchParams({});
  });

  it('le pied de page blanc descend jusqu’en bas (marge sûre dans son fond)', async () => {
    await openGuests();
    const footer = screen.getByTestId('search-footer');
    expect(footer.props.className).toContain('bg-card');
    expect(footer).toHaveStyle({ paddingBottom: 8 });
    expect(screen.getByRole('button', { name: 'Tout effacer' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Rechercher/ })).toBeOnTheScreen();
  });
});
