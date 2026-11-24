import palette from '@afro/config/tailwind/palette.cjs';

export type ColorSchemeName = 'light' | 'dark';

/** Les noms des couleurs, les mêmes que les classes (« bg-primary », « text-muted-foreground »…). */
export type ColorName =
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'primary'
  | 'primary-hover'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'cta'
  | 'cta-hover'
  | 'cta-foreground'
  | 'title-accent'
  | 'ochre'
  | 'clay'
  | 'border'
  | 'input'
  | 'ring'
  | 'destructive'
  | 'destructive-foreground'
  | 'success'
  | 'success-muted'
  | 'warning'
  | 'warning-muted'
  | 'sidebar'
  | 'sidebar-foreground'
  | 'sidebar-primary'
  | 'sidebar-primary-foreground';

export type Palette = Record<ColorName, string>;

/** Les couleurs des deux thèmes, en hexadécimal (« #7A1F0E »). */
export const palettes: Record<ColorSchemeName, Palette> = {
  light: palette.light as Palette,
  dark: palette.dark as Palette,
};

export const colorNames = palette.names as ColorName[];

/**
 * Les variables CSS d'un thème, au format lu par NativeWind :
 * { '--color-primary': '122 31 14', … }. Voir ThemeRoot.
 */
export function cssVariables(scheme: ColorSchemeName): Record<string, string> {
  return Object.fromEntries(
    colorNames.map((name) => [`--color-${name}`, palette.toRgbChannels(palettes[scheme][name])]),
  );
}
