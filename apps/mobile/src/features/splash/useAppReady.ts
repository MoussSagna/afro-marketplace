import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { prepareDemoData } from '@/lib/demoData';

/**
 * Ce qu'il faut charger avant d'afficher l'app, en même temps :
 * - les polices de la marque (Nunito, la police du logo, en 4 graisses) ;
 * - les données de démo et la session sauvegardées sur le téléphone.
 * Renvoie true quand tout est prêt.
 */
export function useAppReady(): boolean {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    // Si la sauvegarde est illisible, on continue avec le jeu de démo d'origine.
    prepareDemoData()
      .catch(() => {})
      .finally(() => setDataReady(true));
  }, []);

  // En cas d'erreur de police, on continue avec celles du système plutôt que de bloquer l'app.
  return (fontsLoaded || Boolean(fontError)) && dataReady;
}
