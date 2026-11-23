import { render, screen } from '@testing-library/react-native';
import { renderRouter, screen as routerScreen } from 'expo-router/testing-library';
import { WelcomeScreen } from './WelcomeScreen';

// À savoir : depuis Testing Library React Native 14, `render` est asynchrone (React 19).
// On écrit donc toujours `await render(...)`, comme `await renderRouter(...)`.

describe('Écran de bienvenue (lot M1)', () => {
  it('affiche le titre Wenzee', async () => {
    await render(<WelcomeScreen />);
    expect(screen.getByRole('header')).toHaveTextContent('Bonjour Wenzee');
  });

  it('utilise le code partagé de @afro/common pour formater un prix', async () => {
    await render(<WelcomeScreen />);
    // formatPrice(2500) → « 25 € » (espace insécable avant l'euro).
    expect(screen.getByText(/À partir de 25\s€ \/ pers\./)).toBeOnTheScreen();
  });
});

describe('Navigation (Expo Router)', () => {
  it("ouvre l'écran de bienvenue à l'adresse « / »", async () => {
    await renderRouter({ index: WelcomeScreen }, { initialUrl: '/' });
    expect(await routerScreen.findByText(/Bonjour/)).toBeOnTheScreen();
    expect(routerScreen).toHavePathname('/');
  });
});
