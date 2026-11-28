import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config';
import { colorNames, cssVariables, palettes, type ColorName } from './palette';

/**
 * Le site (Tailwind v4) lit ses couleurs dans theme.css, l'app (NativeWind) dans palette.cjs
 * construit depuis tokens.json. Ce test vérifie que le thème clair dit la même chose que le site
 * (si quelqu'un change une couleur d'un seul côté, il échoue) et que le thème sombre est complet.
 */
const themeCss = readFileSync(
  join(__dirname, '../../../../packages/config/tailwind/theme.css'),
  'utf8',
);

function cssVariable(name: string): string {
  const match = themeCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`Variable --${name} introuvable dans theme.css`);
  return match[1].toUpperCase();
}

type ColorTree = Record<string, string | Record<string, string>>;
const colors = resolveConfig(tailwindConfig).theme.colors as unknown as ColorTree;

/** « primary-foreground » → colors.primary.foreground ; « primary » → colors.primary.DEFAULT */
function presetColor(name: string): string {
  const direct = colors[name];
  if (typeof direct === 'string') return direct;
  if (direct?.DEFAULT) return direct.DEFAULT;
  const [group, ...rest] = name.split('-');
  const value = (colors[group ?? ''] as Record<string, string> | undefined)?.[rest.join('-')];
  if (!value) throw new Error(`Couleur ${name} absente du preset`);
  return value;
}

/** Les variables écrites dans global.css (thème clair par défaut). */
const globalCss = readFileSync(join(__dirname, '../../global.css'), 'utf8');

/** Contraste WCAG entre deux couleurs hexadécimales (1 à 21). */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

const SHARED_COLORS = [
  'background',
  'foreground',
  'primary',
  'primary-hover',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'cta',
  'cta-hover',
  'cta-foreground',
  'title-accent',
  'ochre',
  'clay',
  'destructive',
  'destructive-foreground',
  'success',
  'success-muted',
  'warning',
  'warning-muted',
  'border',
  'input',
  'ring',
  'sidebar',
  'sidebar-foreground',
];

describe('Preset NativeWind (packages/config/tailwind/preset.cjs)', () => {
  it.each(SHARED_COLORS)('la couleur « %s » du thème clair est la même que sur le site', (name) => {
    expect(palettes.light[name as ColorName].toUpperCase()).toBe(cssVariable(name));
  });

  it.each(colorNames)('« %s » lit sa variable CSS (pour changer de thème)', (name) => {
    expect(presetColor(name)).toBe(`rgb(var(--color-${name}) / <alpha-value>)`);
  });

  it.each(colorNames)('« %s » a une valeur dans le thème sombre', (name) => {
    expect(palettes.dark[name]).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('global.css donne les valeurs du thème clair par défaut', () => {
    for (const [variable, value] of Object.entries(cssVariables('light'))) {
      expect(globalCss).toContain(`${variable}: ${value};`);
    }
  });

  it('le thème sombre garde des textes lisibles (contraste AA, 4,5:1)', () => {
    const dark = palettes.dark;
    expect(contrast(dark.foreground, dark.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['muted-foreground'], dark.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['muted-foreground'], dark.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.primary, dark.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['primary-foreground'], dark.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['cta-foreground'], dark.cta)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.destructive, dark.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.success, dark.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('déclare les polices chargées par expo-font', () => {
    const fonts = resolveConfig(tailwindConfig).theme.fontFamily as Record<string, string[]>;
    expect(fonts.sans).toEqual(['Nunito_400Regular']);
    expect(fonts.display).toEqual(['Nunito_700Bold']);
  });

  it('reprend les rayons de la maquette (10 px champs, 16 px cartes)', () => {
    const radius = resolveConfig(tailwindConfig).theme.borderRadius as Record<string, string>;
    expect(radius.md).toBe('10px');
    expect(radius.xl).toBe('16px');
  });
});
