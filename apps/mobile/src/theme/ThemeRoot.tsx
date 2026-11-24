import { vars } from 'nativewind';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cssVariables, type ColorSchemeName } from './palette';
import { useColorSchemeName } from './useTheme';

/** Les variables de chaque thème, calculées une fois. */
const THEME_VARS: Record<ColorSchemeName, ReturnType<typeof vars>> = {
  light: vars(cssVariables('light')),
  dark: vars(cssVariables('dark')),
};

/**
 * Pose les couleurs du thème (clair ou sombre) autour de toute l'app.
 * Les classes comme `bg-background` lisent une variable (`--color-background`) : en changeant
 * les valeurs ici, tous les écrans changent de couleur d'un coup, sans être réécrits.
 */
export function ThemeRoot({ children }: { children: ReactNode }) {
  const scheme = useColorSchemeName();
  return (
    <View style={[{ flex: 1 }, THEME_VARS[scheme]]} testID={`theme-${scheme}`}>
      {children}
    </View>
  );
}
