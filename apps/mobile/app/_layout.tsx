import { Stack } from 'expo-router';

/**
 * La racine de la navigation (Expo Router : un fichier dans app/ = un écran).
 * Les onglets client et pro arrivent au lot M4.
 */
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
