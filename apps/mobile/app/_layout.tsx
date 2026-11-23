import '../global.css';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

/**
 * La racine de la navigation (Expo Router : un fichier dans app/ = un écran).
 * On charge d'abord les polices de la marque (Inter et Playfair Display).
 * Les onglets client et pro, et le splash animé, arrivent au lot M4.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  // Tant que les polices chargent, l'écran de démarrage natif reste affiché.
  // En cas d'erreur, on continue avec les polices du système plutôt que de bloquer l'app.
  if (!fontsLoaded && !fontError) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FDF7F0' } }} />
  );
}
