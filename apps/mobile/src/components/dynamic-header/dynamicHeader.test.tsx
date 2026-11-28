import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { DynamicVendorHeader } from './DynamicVendorHeader';
import { MIN_FADE_DISTANCE, titleRevealProgress } from './useDynamicHeader';

// Un titre principal à 340 pt du haut de la page, haut de 34 pt ; header de 103 pt (Safe Area 47 + barre 56).
const TOP = 340;
const HEIGHT = 34;
const HEADER = 103;
const END = TOP + HEIGHT - HEADER; // le bas du titre passe derrière le header
const START = END - Math.max(HEIGHT, MIN_FADE_DISTANCE);

describe('titleRevealProgress (position réelle du titre)', () => {
  it('vaut 0 en haut de page et tant que le titre principal est visible (état A)', () => {
    expect(titleRevealProgress(0, TOP, HEIGHT, HEADER)).toBe(0);
    expect(titleRevealProgress(START, TOP, HEIGHT, HEADER)).toBe(0);
  });

  it('progresse sans à-coup pendant que le titre passe sous le header (état B)', () => {
    const middle = titleRevealProgress((START + END) / 2, TOP, HEIGHT, HEADER);
    expect(middle).toBeCloseTo(0.5);
    const steps = Array.from({ length: 11 }, (_, i) =>
      titleRevealProgress(START + ((END - START) * i) / 10, TOP, HEIGHT, HEADER),
    );
    steps.slice(1).forEach((value, i) => expect(value).toBeGreaterThanOrEqual(steps[i]!));
  });

  it('vaut 1 dès que le titre principal est sorti de l’écran, et le reste (état C)', () => {
    expect(titleRevealProgress(END, TOP, HEIGHT, HEADER)).toBe(1);
    expect(titleRevealProgress(END + 2000, TOP, HEIGHT, HEADER)).toBe(1);
  });

  it('suit la taille de l’écran : une Safe Area plus haute fait apparaître le titre plus tôt', () => {
    const scroll = END - 10;
    const small = titleRevealProgress(scroll, TOP, HEIGHT, 24 + 56); // Android, petite barre d'état
    const notch = titleRevealProgress(scroll, TOP, HEIGHT, 59 + 56); // iPhone à Dynamic Island
    expect(notch).toBeGreaterThan(small);
  });

  it('suit la hauteur du titre : un nom sur deux lignes finit son fondu plus loin', () => {
    expect(titleRevealProgress(END, TOP, HEIGHT * 2, HEADER)).toBeLessThan(1);
  });

  it('reste à 0 tant que le titre n’est pas mesuré (pas de clignotement au chargement)', () => {
    expect(titleRevealProgress(5000, 0, 0, HEADER)).toBe(0);
  });
});

function renderHeader(progress: number, props: Partial<Parameters<typeof DynamicVendorHeader>[0]>) {
  const onBack = jest.fn();
  const onToggleFavorite = jest.fn();
  const view = render(
    <DynamicVendorHeader
      title="Saveurs de Dakar"
      progress={{ value: progress } as never}
      safeAreaTop={47}
      onBack={onBack}
      isFavorite={false}
      onToggleFavorite={onToggleFavorite}
      {...props}
    />,
  );
  return { view, onBack, onToggleFavorite };
}

const opacityOf = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID, { includeHiddenElements: true }).props.style)
    .opacity as number;

describe('DynamicVendorHeader', () => {
  it('état A : boutons visibles, titre et fond invisibles', async () => {
    await renderHeader(0, {}).view;
    expect(screen.getByRole('button', { name: 'Retour' })).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Ajouter Saveurs de Dakar aux favoris' }),
    ).toBeOnTheScreen();
    expect(opacityOf('dynamic-header-title')).toBe(0);
    expect(opacityOf('dynamic-header-background')).toBe(0);
  });

  it('état B : le voile arrive d’abord, puis le titre fond et remonte vers sa place', async () => {
    await renderHeader(0.5, {}).view;
    const style = StyleSheet.flatten(
      screen.getByTestId('dynamic-header-title', { includeHiddenElements: true }).props.style,
    );
    expect(style.opacity).toBeCloseTo(1 / 3); // (0,5 − 0,25) / 0,75
    expect(opacityOf('dynamic-header-background')).toBe(1);
    expect(style.transform).toEqual([{ translateY: 4 }]);
  });

  it('état C : titre visible au centre, sur une seule ligne avec « … »', async () => {
    const long = 'Orchestre Mandingue de la Grande Région Parisienne et Environs';
    await renderHeader(1, { title: long }).view;
    expect(opacityOf('dynamic-header-title')).toBe(1);
    expect(opacityOf('dynamic-header-background')).toBe(1);
    const title = screen.getByText(long, { includeHiddenElements: true });
    expect(title.props.numberOfLines).toBe(1);
    expect(title.props.ellipsizeMode).toBe('tail');
  });

  it('le titre du header est caché aux lecteurs d’écran (le vrai titre est dans la page)', async () => {
    await renderHeader(1, {}).view;
    expect(screen.queryByText('Saveurs de Dakar')).toBeNull();
  });

  it('respecte la Safe Area : la barre commence sous l’encoche', async () => {
    await renderHeader(0, { safeAreaTop: 59 }).view;
    expect(StyleSheet.flatten(screen.getByTestId('dynamic-header').props.style).height).toBe(
      59 + 56,
    );
  });

  it('Retour et Favori appellent leurs actions ; le cœur annonce son état', async () => {
    const { view, onBack, onToggleFavorite } = renderHeader(0, { isFavorite: true });
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
    const heart = screen.getByRole('button', { name: 'Retirer Saveurs de Dakar des favoris' });
    expect(heart).toBeSelected();
    await fireEvent.press(heart);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});
