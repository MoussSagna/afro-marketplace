import { render, screen } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { i18n } from '@/i18n';
import { useThemeStore } from '@/theme/themeStore';
import { LOADER_FULL_LOGO, loaderFrame } from './loaderFrame';
import { WenzeeLoader } from './WenzeeLoader';

const CREAM = '#FDF7F0';
const EARTH = '#7A1F0E';

type Node = { props?: Record<string, unknown>; children?: (Node | string)[] | null };

/** Toutes les props des éléments rendus (les tracés SVG compris), à plat. */
function allProps(): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const walk = (node: Node | Node[] | string | null) => {
    if (!node || typeof node === 'string') return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.props) out.push(node.props);
    node.children?.forEach(walk);
  };
  walk(screen.toJSON() as Node | Node[] | null);
  return out;
}

/** react-native-svg range ses couleurs en nombre (0xAARRGGBB) : on les remet en « #RRGGBB ». */
function hex(color: unknown) {
  const payload = (color as { payload?: number } | null)?.payload;
  if (typeof payload !== 'number') return null;
  return `#${(payload & 0xffffff).toString(16).padStart(6, '0').toUpperCase()}`;
}

/** Les couleurs des deux arches du W (traits du logo, hors lien orange et hors masque noir). */
function archColors() {
  return allProps()
    .filter((props) => typeof props.d === 'string')
    .map((props) => hex(props.stroke))
    .filter((stroke) => stroke && !['#F0A422', '#000000'].includes(stroke));
}

afterEach(() => {
  jest.mocked(useReducedMotion).mockReturnValue(false);
  useThemeStore.setState({ preference: 'system' });
});

describe('WenzeeLoader (le logo du splash en boucle)', () => {
  it('se présente comme un chargement, « Chargement » par défaut', async () => {
    await render(<WenzeeLoader />);
    expect(screen.getByRole('progressbar', { name: 'Chargement' })).toBeOnTheScreen();
  });

  it('affiche son message, qui sert aussi de nom pour VoiceOver', async () => {
    await render(<WenzeeLoader message="On cherche les meilleurs talents…" />);
    expect(screen.getByText('On cherche les meilleurs talents…')).toBeOnTheScreen();
    expect(
      screen.getByRole('progressbar', { name: 'On cherche les meilleurs talents…' }),
    ).toBeOnTheScreen();
  });

  it('parle anglais avec le reste de l’app', async () => {
    await i18n.changeLanguage('en');
    await render(<WenzeeLoader />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeOnTheScreen();
  });

  it('dessine la boucle en rouille sur fond clair, en ivoire en thème sombre ou sur fond foncé', async () => {
    const { rerender } = await render(<WenzeeLoader />);
    expect(archColors()).toEqual([EARTH, EARTH]);

    await rerender(<WenzeeLoader onDark />);
    expect(archColors()).toEqual([CREAM, CREAM]);

    useThemeStore.setState({ preference: 'dark' });
    await rerender(<WenzeeLoader />);
    expect(archColors()).toEqual([CREAM, CREAM]);
  });

  it('suit les étapes de la maquette : boucle, lien, losange, puis effacement', () => {
    expect(loaderFrame(0)).toMatchObject({ arch: 0, weave: 0, tail: 0, diamond: 0, opacity: 1 });
    expect(loaderFrame(0.32).arch).toBe(1);
    expect(loaderFrame(0.32).weave).toBeGreaterThan(0);
    expect(loaderFrame(0.32).weave).toBeLessThan(1);
    expect(loaderFrame(0.6)).toMatchObject({ arch: 1, weave: 1, tail: 1, diamond: 1, opacity: 1 });
    expect(loaderFrame(0.94).opacity).toBe(0);
  });

  it('montre le logo entier quand les animations sont réduites', async () => {
    expect(loaderFrame(LOADER_FULL_LOGO)).toMatchObject({
      arch: 1,
      weave: 1,
      tail: 1,
      diamond: 1,
      opacity: 1,
    });
    jest.mocked(useReducedMotion).mockReturnValue(true);
    await render(<WenzeeLoader />);
    expect(screen.getByRole('progressbar', { name: 'Chargement' })).toBeOnTheScreen();
  });

  it('a un masque propre à chaque loader, même s’ils sont plusieurs à l’écran', async () => {
    await render(
      <>
        <WenzeeLoader />
        <WenzeeLoader />
      </>,
    );
    const masks = allProps()
      .map((props) => props.mask)
      .filter((mask) => typeof mask === 'string');
    expect(masks).toHaveLength(2);
    expect(new Set(masks).size).toBe(2);
  });
});
