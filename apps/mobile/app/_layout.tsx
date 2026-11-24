// En premier : ce qui manque au moteur JavaScript du téléphone (URL, crypto.randomUUID).
import '@/lib/polyfills';
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
import { useEffect, useState } from 'react';
import { AppProviders } from '@/providers/AppProviders';
import { prepareDemoData } from '@/lib/demoData';

/**
 * La racine de la navigation (Expo Router : un fichier dans app/ = un écran).
 * Au démarrage, en même temps :
 * - on charge les polices de la marque (Inter et Playfair Display) ;
 * - on recharge les données de démo et la session sauvegardées sur le téléphone.
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
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    // Si la sauvegarde est illisible, on continue avec le jeu de démo d'origine.
    prepareDemoData()
      .catch(() => {})
      .finally(() => setDataReady(true));
  }, []);

  // Tant que tout charge, l'écran de démarrage natif reste affiché.
  // En cas d'erreur de police, on continue avec celles du système plutôt que de bloquer l'app.
  if ((!fontsLoaded && !fontError) || !dataReady) return null;

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FDF7F0' } }} />
    </AppProviders>
  );
}
