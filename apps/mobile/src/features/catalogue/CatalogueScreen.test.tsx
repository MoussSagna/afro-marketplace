import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { demoApi, testProviders } from '@/test/demoApi';
import { SearchScreen } from '../search/SearchScreen';
import { CatalogueScreen } from './CatalogueScreen';

const routes = { index: SearchScreen, catalogue: CatalogueScreen };

afterEach(() => jest.useRealTimers()); // renderRouter laisse les faux minuteurs actifs

describe('Catalogue des composants (lot M2)', () => {
  it("s'ouvre depuis la Recherche et revient en arrière", async () => {
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(demoApi().api) });

    await fireEvent.press(screen.getByRole('link', { name: 'Voir les composants' }));
    expect(await screen.findByText('Catalogue des composants')).toBeOnTheScreen();
    expect(screen).toHavePathname('/catalogue');

    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
    expect(await screen.findByTestId('search-state-home')).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
  });

  it('montre toutes les familles de composants', async () => {
    await renderRouter(routes, { initialUrl: '/catalogue', wrapper: testProviders(demoApi().api) });
    for (const title of [
      'Logo',
      'Typographie',
      'Boutons',
      'Champs',
      'Pastilles et badges',
      'Cartes, avatars et notes',
      'État vide',
    ]) {
      expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
    }
  });

  it('coche et décoche une origine en touchant sa pastille', async () => {
    await renderRouter(routes, { initialUrl: '/catalogue', wrapper: testProviders(demoApi().api) });
    const mali = screen.getByRole('button', { name: 'Mali' });
    expect(mali).not.toBeSelected();
    await fireEvent.press(mali);
    expect(screen.getByRole('button', { name: 'Mali' })).toBeSelected();
    await fireEvent.press(screen.getByRole('button', { name: 'Sénégal' }));
    expect(screen.getByRole('button', { name: 'Sénégal' })).not.toBeSelected();
  });

  it("affiche l'exemple d'erreur de champ", async () => {
    await renderRouter(routes, { initialUrl: '/catalogue', wrapper: testProviders(demoApi().api) });
    expect(
      screen.getByText("Ce prestataire n'est pas disponible ce jour-là. Choisis une autre date."),
    ).toBeOnTheScreen();
  });
});
