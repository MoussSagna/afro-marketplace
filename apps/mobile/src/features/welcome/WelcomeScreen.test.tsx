import { render, screen } from '@testing-library/react-native';
import { renderRouter, screen as routerScreen } from 'expo-router/testing-library';
import { demoApi, testProviders } from '@/test/demoApi';
import { WelcomeScreen } from './WelcomeScreen';

// À savoir : depuis Testing Library React Native 14, `render` est asynchrone (React 19).
// On écrit donc toujours `await render(...)`, comme `await renderRouter(...)`.
// L'Accueil charge des données de démo : il lui faut les fournisseurs de l'app (testProviders).

afterEach(() => jest.useRealTimers()); // renderRouter laisse les faux minuteurs actifs

describe('Accueil provisoire (lots M1 à M4)', () => {
  it('affiche le titre Wenzee', async () => {
    await render(<WelcomeScreen />, { wrapper: testProviders(demoApi().api) });
    expect(screen.getByRole('header', { name: 'Bonjour Wenzee' })).toBeOnTheScreen();
  });

  it('utilise le code partagé de @afro/common pour formater un prix', async () => {
    await render(<WelcomeScreen />, { wrapper: testProviders(demoApi().api) });
    // formatPrice(2500) → « 25 € » (espace insécable avant l'euro).
    expect(screen.getByText(/À partir de 25\s€ \/ pers\./)).toBeOnTheScreen();
  });

  it('montre les données de démo (catégories)', async () => {
    const { db, api } = demoApi();
    await render(<WelcomeScreen />, { wrapper: testProviders(api) });
    const first = db.data.categories.find((c) => !c.parentId)!;
    expect(await screen.findByText(first.name)).toBeOnTheScreen();
  });
});

describe('Navigation (Expo Router)', () => {
  it("ouvre l'Accueil à l'adresse « / »", async () => {
    await renderRouter(
      { index: WelcomeScreen },
      { initialUrl: '/', wrapper: testProviders(demoApi().api) },
    );
    expect(await routerScreen.findByText(/Bonjour/)).toBeOnTheScreen();
    expect(routerScreen).toHavePathname('/');
  });
});
