import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config';

/**
 * Le site (Tailwind v4) lit ses couleurs dans theme.css, l'app (NativeWind) dans le preset
 * construit depuis tokens.json. Ce test vérifie que les deux disent la même chose :
 * si quelqu'un change une couleur d'un seul côté, il échoue.
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
  if (typeof direct === 'string') return direct.toUpperCase();
  if (direct?.DEFAULT) return direct.DEFAULT.toUpperCase();
  const [group, ...rest] = name.split('-');
  const value = (colors[group ?? ''] as Record<string, string> | undefined)?.[rest.join('-')];
  if (!value) throw new Error(`Couleur ${name} absente du preset`);
  return value.toUpperCase();
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
  it.each(SHARED_COLORS)('la couleur « %s » est la même que sur le site', (name) => {
    expect(presetColor(name)).toBe(cssVariable(name));
  });

  it('déclare les polices chargées par expo-font', () => {
    const fonts = resolveConfig(tailwindConfig).theme.fontFamily as Record<string, string[]>;
    expect(fonts.sans).toEqual(['Inter_400Regular']);
    expect(fonts.display).toEqual(['PlayfairDisplay_700Bold']);
  });

  it('reprend les rayons de la maquette (10 px champs, 16 px cartes)', () => {
    const radius = resolveConfig(tailwindConfig).theme.borderRadius as Record<string, string>;
    expect(radius.md).toBe('10px');
    expect(radius.xl).toBe('16px');
  });
});
