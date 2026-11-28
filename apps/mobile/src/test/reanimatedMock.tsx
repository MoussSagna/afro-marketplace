import { forwardRef, type ComponentType } from 'react';
import { ScrollView, View } from 'react-native';

/**
 * Un faux Reanimated pour Jest (le vrai a besoin du moteur natif des « worklets »,
 * et ses propres faux ne se chargent pas avec Reanimated 4 dans Node).
 * Les animations sautent à leur valeur finale ; on teste le comportement, pas le mouvement.
 * N'expose que ce que l'app utilise : à compléter si un écran utilise autre chose.
 */
function createAnimatedComponent<P extends object>(Component: ComponentType<P>) {
  return forwardRef<unknown, P & { animatedProps?: object }>(function Animated(
    { animatedProps, ...props },
    ref,
  ) {
    const Any = Component as ComponentType<Record<string, unknown>>;
    return <Any ref={ref} {...props} {...animatedProps} />;
  });
}

function interpolate(value: number, input: number[], output: number[]) {
  if (value <= input[0]!) return output[0]!;
  for (let i = 1; i < input.length; i++) {
    if (value <= input[i]!) {
      const ratio = (value - input[i - 1]!) / (input[i]! - input[i - 1]!);
      return output[i - 1]! + ratio * (output[i]! - output[i - 1]!);
    }
  }
  return output[output.length - 1]!;
}

const identity = <T,>(value: T) => value;
const easing = () => identity;

export const reanimatedMock = {
  __esModule: true,
  default: {
    View: createAnimatedComponent(View),
    ScrollView: createAnimatedComponent(ScrollView),
    createAnimatedComponent,
  },
  createAnimatedComponent,
  interpolate,
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  Easing: {
    linear: identity,
    ease: identity,
    bezier: easing,
    in: easing,
    out: easing,
    inOut: easing,
  },
  useSharedValue: <T,>(value: T) => ({ value }),
  useAnimatedStyle: (factory: () => object) => factory(),
  useDerivedValue: <T,>(factory: () => T) => ({ value: factory() }),
  // Le gestionnaire reçoit l'événement natif, comme le vrai (`event.contentOffset.y`).
  useAnimatedScrollHandler:
    (handler: (event: unknown) => void) => (event: { nativeEvent?: unknown }) =>
      handler(event.nativeEvent ?? event),
  useAnimatedProps: (factory: () => object) => factory(),
  useReducedMotion: jest.fn(() => false),
  withTiming: identity,
  withSpring: identity,
  withDelay: (_delay: number, value: unknown) => value,
  withRepeat: identity,
  withSequence: (...values: unknown[]) => values[values.length - 1],
};
