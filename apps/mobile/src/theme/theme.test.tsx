import { renderHook, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import * as ReactNative from 'react-native';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { demoApi, testProviders } from '@/test/demoApi';
import { palettes } from './palette';
import { useThemeStore } from './themeStore';
import { useColorSchemeName, useThemeColors } from './useTheme';

afterEach(() => {
  useThemeStore.setState({ preference: 'system' });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('Thème clair / sombre (lot M6c)', () => {
  it('suit le réglage du téléphone par défaut', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const { result } = await renderHook(() => useColorSchemeName());
    expect(result.current).toBe('dark');
  });

  it('reste en clair si le téléphone ne dit rien', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(null);
    const { result } = await renderHook(() => useThemeColors());
    expect(result.current.background).toBe(palettes.light.background);
  });

  it('le choix de la personne passe avant celui du téléphone', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    useThemeStore.setState({ preference: 'dark' });
    const { result } = await renderHook(() => useThemeColors());
    expect(result.current.primary).toBe(palettes.dark.primary);
  });

  it('pose les couleurs sombres autour de toute l’app', async () => {
    useThemeStore.setState({ preference: 'dark' });
    const routes = {
      index: () => (
        <SignInRequired title="Demandes" reason="Connecte-toi.">
          {null}
        </SignInRequired>
      ),
    };
    await renderRouter(routes, { initialUrl: '/', wrapper: testProviders(demoApi().api) });
    expect(screen.getByTestId('theme-dark')).toBeOnTheScreen();
    expect(screen.queryByTestId('theme-light')).toBeNull();
    expect(screen.getByRole('header', { name: 'Connecte-toi' })).toBeOnTheScreen();
  });
});
