// En premier : ce qui manque au moteur JavaScript du téléphone (URL, crypto.randomUUID…).
import '@/lib/polyfills';
import '../global.css';
import { Stack } from 'expo-router';
import { SplashGate } from '@/features/splash/SplashGate';
import { useAppReady } from '@/features/splash/useAppReady';
import { AppProviders } from '@/providers/AppProviders';
import { useThemeColors } from '@/theme/useTheme';

/**
 * La racine de la navigation (Expo Router : un fichier dans app/ = un écran).
 * - Au démarrage : polices + données de démo (useAppReady), puis le splash animé (SplashGate).
 * - Ensuite : les onglets du mode client (app/(tabs)/) et, par-dessus, les écrans
 *   de travail (catalogue, données de démo).
 */
export default function RootLayout() {
  const ready = useAppReady();
  const colors = useThemeColors();
  return (
    <SplashGate ready={ready}>
      <AppProviders>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </AppProviders>
    </SplashGate>
  );
}
