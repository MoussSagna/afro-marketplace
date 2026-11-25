import { Stack } from 'expo-router';
import { useThemeColors } from '@/theme/useTheme';

/**
 * Le mode prestataire : une pile, comme la racine. Dessous, les 5 onglets bruns (app/pro/(tabs)/) ;
 * par-dessus, sans la barre d'onglets, le détail d'une demande et une conversation (lot M14).
 */
export default function ProLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
