import { act, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Text } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { SPLASH_DURATION_MS, SPLASH_REDUCED_MS } from './AnimatedSplash';
import { SplashGate } from './SplashGate';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(SplashScreen.hideAsync).mockClear();
});
afterEach(() => {
  jest.useRealTimers();
  jest.mocked(Reanimated.useReducedMotion).mockReturnValue(false);
});

const App = () => <Text>Accueil</Text>;

describe('SplashGate : le démarrage de l’app', () => {
  it('garde le splash natif tant que l’app charge', async () => {
    await render(
      <SplashGate ready={false}>
        <App />
      </SplashGate>,
    );
    expect(screen.queryByText('Accueil')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('animated-splash')).not.toBeOnTheScreen();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('une fois prête : cache le natif, joue le splash animé, puis le retire', async () => {
    await render(
      <SplashGate ready>
        <App />
      </SplashGate>,
    );
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Wenzee, chargement')).toBeOnTheScreen();
    expect(screen.getByText('Les talents qui font vivre nos cultures')).toBeOnTheScreen();

    await act(() => jest.advanceTimersByTime(SPLASH_DURATION_MS - 100));
    expect(screen.getByTestId('animated-splash')).toBeOnTheScreen();

    await act(() => jest.advanceTimersByTime(100));
    expect(screen.queryByTestId('animated-splash')).not.toBeOnTheScreen();
    expect(screen.getByText('Accueil')).toBeOnTheScreen();
  });

  it('avec « Réduire les animations », le splash est bien plus court', async () => {
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(true);
    await render(
      <SplashGate ready>
        <App />
      </SplashGate>,
    );
    expect(screen.getByTestId('animated-splash')).toBeOnTheScreen();
    await act(() => jest.advanceTimersByTime(SPLASH_REDUCED_MS));
    expect(screen.queryByTestId('animated-splash')).not.toBeOnTheScreen();
  });
});
