import type { ProviderSearchFilters } from '@afro/common';
import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { demoApi, testProviders } from '@/test/demoApi';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { draftChanges, draftFrom, weekendDates } from './filterDraft';
import { SearchScreen } from './SearchScreen';

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': SearchScreen,
  '(tabs)/favoris': Empty,
  '(tabs)/evenements': Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
};

/** Ouvre la Recherche ; `expected` : des recherches faites AVANT l'affichage (faux minuteurs). */
async function open(initialUrl: string, expected: ProviderSearchFilters[] = []) {
  const { db, api } = demoApi();
  const totals = await Promise.all(expected.map(async (f) => (await api.searchProviders(f)).total));
  await renderRouter(routes, { initialUrl, wrapper: testProviders(api) });
  return { db, totals };
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const filtersButton = () => screen.queryByRole('button', { name: /^Filtres/ });
const plural = (count: number) => `${count} prestataire${count > 1 ? 's' : ''}`;

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  jest.useRealTimers(); // renderRouter laisse les faux minuteurs actifs
});

describe('Bouton Filtres : seulement pendant une recherche', () => {
  it('absent en découverte, présent dès qu’une recherche est lancée, absent au retour', async () => {
    const { db } = await open('/');
    expect(screen.getByTestId('search-state-home')).toBeOnTheScreen();
    // La pilule est là, sans bouton Filtres.
    expect(screen.getByRole('search', { name: /^Que cherches-tu \?/ })).toBeOnTheScreen();
    expect(filtersButton()).toBeNull();

    // Lancer une recherche (une catégorie de l'accueil) : le bouton apparaît.
    const beauty = db.data.categories.find((c) => c.slug === 'beaute-soins')!;
    await fireEvent.press(await screen.findByRole('button', { name: beauty.name }));
    expect(await screen.findByTestId('search-state-results')).toBeOnTheScreen();
    expect(filtersButton()).toBeOnTheScreen();

    // Modifier la recherche (une autre catégorie) : le bouton reste.
    await fireEvent.press(screen.getByRole('button', { name: 'Traiteur & boissons' }));
    expect(filtersButton()).toBeOnTheScreen();

    // Revenir en découverte : le bouton disparaît.
    await press('Effacer la recherche');
    expect(await screen.findByTestId('search-state-home')).toBeOnTheScreen();
    expect(filtersButton()).toBeNull();
  });

  it('ouvrir le champ de recherche ne suffit pas à montrer le bouton', async () => {
    await open('/');
    await fireEvent.press(screen.getByRole('search', { name: /^Que cherches-tu \?/ }));
    expect(screen.getByText('Ta recherche')).toBeOnTheScreen();
    expect(filtersButton()).toBeNull();
  });
});

describe('Panneau des filtres (bottom sheet)', () => {
  it('s’ouvre avec la liste des filtres et le nombre de résultats', async () => {
    const { totals } = await open('/?vue=resultats', [{}]);
    await press(/^Filtres/);
    expect(screen.getByRole('header', { name: 'Filtres' })).toBeOnTheScreen();
    for (const row of [
      'Catégorie, Toutes les catégories',
      'Lieu, Partout',
      'Date, Ajouter une date',
      'Budget, Toutes les tranches',
      'Note, Toutes les notes',
    ]) {
      expect(screen.getByRole('button', { name: row })).toBeOnTheScreen();
    }
    expect(screen.getByRole('switch', { name: 'Vérifiés uniquement' })).toBeOnTheScreen();
    expect(
      await screen.findByRole('button', { name: `Afficher ${plural(totals[0]!)}` }),
    ).toBeOnTheScreen();
  });

  it('choisit et retire une catégorie, une ville, une date et une note, puis les applique', async () => {
    const chosen = { category: 'beaute-soins', city: 'Paris', minRating: 4 };
    const { totals } = await open('/?vue=resultats', [chosen]);
    await press(/^Filtres/);

    // Catégorie : choisir, retirer, rechoisir.
    await press('Catégorie, Toutes les catégories');
    await fireEvent.press(await screen.findByRole('radio', { name: 'Beauté & soins' }));
    expect(screen.getByRole('radio', { name: 'Beauté & soins', checked: true })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Beauté & soins' }));
    expect(screen.getByRole('radio', { name: 'Beauté & soins', checked: false })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Beauté & soins' }));
    await press('Valider');
    expect(screen.getByRole('button', { name: 'Catégorie, Beauté & soins' })).toBeOnTheScreen();

    // Lieu : les vraies villes des prestataires.
    await press('Lieu, Partout');
    await fireEvent.press(
      await screen.findByRole('button', { name: /^Paris, \d+ prestataires?$/ }),
    );
    await press('Valider');

    // Date : le raccourci « Ce week-end », puis « Sans date ».
    await press('Date, Ajouter une date');
    await press('Ce week-end');
    expect(screen.getByRole('button', { name: 'Ce week-end', selected: true })).toBeOnTheScreen();
    await press('Sans date');
    await press('Valider');
    expect(screen.getByRole('button', { name: 'Date, Ajouter une date' })).toBeOnTheScreen();

    // Note : 4 étoiles et plus.
    await press('Note, Toutes les notes');
    await fireEvent.press(screen.getByRole('radio', { name: '4 étoiles et plus' }));
    await press('Valider');

    // Le bouton compte les prestataires qui correspondent, puis applique.
    await fireEvent.press(
      await screen.findByRole('button', { name: `Afficher ${plural(totals[0]!)}` }),
    );
    expect(screen).toHaveSearchParams({
      categorie: 'beaute-soins',
      ville: 'Paris',
      note: '4',
      vue: 'resultats',
    });
    expect(screen.queryByTestId('bottom-sheet-modal')).toBeNull();
    // Les résultats correspondent aux filtres (ou « aucun prestataire » si la démo n'en a pas).
    if (totals[0]) expect(await screen.findByText(plural(totals[0]))).toBeOnTheScreen();
    else expect(await screen.findByText('Aucun prestataire pour l’instant')).toBeOnTheScreen();
  });

  it('« Réinitialiser » vide le brouillon sans toucher à la recherche en cours', async () => {
    await open('/?categorie=beaute-soins&note=4');
    await press(/^Filtres/);
    expect(
      await screen.findByRole('button', { name: 'Catégorie, Beauté & soins' }),
    ).toBeOnTheScreen();
    await press('Réinitialiser');
    expect(
      screen.getByRole('button', { name: 'Catégorie, Toutes les catégories' }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Note, Toutes les notes' })).toBeOnTheScreen();
    // Rien n'est appliqué tant qu'on ne valide pas.
    expect(screen).toHaveSearchParams({ categorie: 'beaute-soins', note: '4' });
  });

  it('fermer sans valider n’applique rien, et rouvrir repart des filtres en cours', async () => {
    await open('/?categorie=beaute-soins');
    await press(/^Filtres/);
    await press('Note, Toutes les notes');
    await fireEvent.press(screen.getByRole('radio', { name: '5 étoiles' }));
    await press('Retour aux filtres');
    expect(screen.getByRole('button', { name: 'Note, 5 étoiles' })).toBeOnTheScreen();
    await press('Fermer les filtres');

    expect(screen.queryByTestId('bottom-sheet-modal')).toBeNull();
    expect(screen).toHaveSearchParams({ categorie: 'beaute-soins' });
    await press(/^Filtres/);
    expect(screen.getByRole('button', { name: 'Note, Toutes les notes' })).toBeOnTheScreen();
  });
});

describe('Brouillon des filtres', () => {
  it('copie seulement les filtres du panneau, et retire ceux qu’on a enlevés', () => {
    expect(draftFrom({ q: 'dj', category: 'beaute-soins', guests: 80, minRating: 4 })).toEqual({
      category: 'beaute-soins',
      minRating: 4,
    });
    expect(draftChanges({ city: 'Paris' })).toEqual({
      category: undefined,
      city: 'Paris',
      date: undefined,
      budgetMax: undefined,
      minRating: undefined,
      origins: undefined,
      sort: undefined,
      verifiedOnly: undefined,
    });
  });

  it('« Ce week-end » est le samedi qui vient, « Week-end prochain » le suivant', () => {
    // Mercredi 2 décembre 2026 → samedi 5 et samedi 12.
    expect(weekendDates(new Date(2026, 11, 2))).toEqual({
      thisWeekend: '2026-12-05',
      nextWeekend: '2026-12-12',
    });
    // Un samedi : ce samedi-là.
    expect(weekendDates(new Date(2026, 11, 5)).thisWeekend).toBe('2026-12-05');
    // Un dimanche : le samedi d'après.
    expect(weekendDates(new Date(2026, 11, 6)).thisWeekend).toBe('2026-12-12');
  });
});
