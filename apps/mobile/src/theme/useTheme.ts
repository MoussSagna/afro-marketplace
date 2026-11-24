import { useColorScheme } from 'react-native';
import { palettes, type ColorSchemeName, type Palette } from './palette';
import { useThemeStore } from './themeStore';

/** Le thème à afficher : celui choisi, ou à défaut celui du téléphone (clair si inconnu). */
export function useColorSchemeName(): ColorSchemeName {
  const system = useColorScheme();
  const preference = useThemeStore((s) => s.preference);
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

/**
 * Les couleurs du thème actuel, en hexadécimal, pour ce qui ne passe pas par `className` :
 * icônes lucide (`color={colors.primary}`), roues de chargement, barre en verre…
 */
export function useThemeColors(): Palette {
  return palettes[useColorSchemeName()];
}
