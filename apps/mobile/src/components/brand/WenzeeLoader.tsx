import { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';
import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useColorSchemeName } from '@/theme/useTheme';
import { LOADER_FULL_LOGO, loaderFrame } from './loaderFrame';
import { ARCH_LEFT, ARCH_RIGHT, LENGTHS, WEAVE } from './logoPaths';

/** Un tour complet de l'animation (maquette, section 9). */
export const LOADER_CYCLE_MS = 1800;

const CREAM = '#FDF7F0';
const EARTH = '#7A1F0E';
const ORANGE = '#F0A422';
const SUN = '#F3B618';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

function useDrawProps(t: SharedValue<number>, length: number, part: 'arch' | 'weave') {
  return useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - loaderFrame(t.value)[part]),
  }));
}

type WenzeeLoaderProps = {
  /** Largeur en points : 110 pour une page, 64 pour une section, 36 dans une liste. */
  size?: number;
  /** Ce que lit VoiceOver (par défaut « Chargement »). */
  label?: string;
  /** Un texte affiché sous le logo (« On cherche les meilleurs talents… »). */
  message?: string;
  /** Sur un fond foncé (photo, menu brun) : la boucle passe en ivoire, même en thème clair. */
  onDark?: boolean;
  className?: string;
};

/**
 * L'indicateur de chargement de Wenzee : le logo du splash qui se dessine en boucle
 * (la boucle, puis le lien orange qui s'y noue, puis le losange), s'efface et recommence.
 * Boucle rouille sur fond clair, ivoire en thème sombre.
 * « Réduire les animations » activé : le logo reste entier et respire doucement.
 * Ex. : <WenzeeLoader size={110} message={t('search.loading')} />
 */
export function WenzeeLoader({
  size = 64,
  label,
  message,
  onDark = false,
  className,
}: WenzeeLoaderProps) {
  const { t: translate } = useTranslation();
  const reduceMotion = useReducedMotion();
  const dark = useColorSchemeName() === 'dark' || onDark;
  // Un identifiant de masque propre à chaque loader (plusieurs peuvent être à l'écran).
  const maskId = `loader-gap-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  // L'horloge : de 0 à 1 en 1,8 s, en boucle. Figée à 0,7 (logo entier) si animations réduites.
  const t = useSharedValue(reduceMotion ? LOADER_FULL_LOGO : 0);
  const breath = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) {
      breath.value = withRepeat(
        withSequence(withTiming(0.45, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
      );
    } else {
      t.value = withRepeat(
        withTiming(1, { duration: LOADER_CYCLE_MS, easing: Easing.linear }),
        -1,
        false,
      );
    }
  }, [reduceMotion, t, breath]);

  const archLeft = useDrawProps(t, LENGTHS.archLeft, 'arch');
  const archRight = useDrawProps(t, LENGTHS.archRight, 'arch');
  const weave = useDrawProps(t, LENGTHS.weave, 'weave');
  const tail = useAnimatedProps(() => ({ opacity: loaderFrame(t.value).tail }));
  const diamond = useAnimatedProps(() => ({ opacity: loaderFrame(t.value).diamond }));
  // Tout s'efface à la fin du tour, avant de recommencer (et respire si animations réduites).
  const whole = useAnimatedStyle(() => {
    const frame = loaderFrame(t.value);
    return { opacity: frame.opacity * breath.value, transform: [{ scale: frame.scale }] };
  });

  const arch = dark ? CREAM : EARTH;
  return (
    <View
      className={cn('items-center gap-3', className)}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? message ?? translate('common.loading')}
      testID="wenzee-loader"
    >
      <Animated.View style={whole}>
        <Svg width={size} height={(size * 200) / 220} viewBox="10 -35 220 200">
          <Defs>
            <Mask id={maskId} maskUnits="userSpaceOnUse" x="-20" y="-40" width="280" height="240">
              <Rect x="-20" y="-40" width="280" height="240" fill="#fff" />
              <Path
                d={WEAVE}
                fill="none"
                stroke="#000"
                strokeWidth={44}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Mask>
          </Defs>
          <G fill="none" strokeWidth={30} strokeLinecap="round" strokeLinejoin="round">
            <AnimatedPath
              d={ARCH_LEFT}
              stroke={arch}
              strokeDasharray={[LENGTHS.archLeft, LENGTHS.archLeft]}
              mask={`url(#${maskId})`}
              animatedProps={archLeft}
            />
            <AnimatedPath
              d={ARCH_RIGHT}
              stroke={arch}
              strokeDasharray={[LENGTHS.archRight, LENGTHS.archRight]}
              animatedProps={archRight}
            />
            <AnimatedPath
              d={WEAVE}
              stroke={ORANGE}
              strokeLinecap="butt"
              strokeDasharray={[LENGTHS.weave, LENGTHS.weave]}
              animatedProps={weave}
            />
            <AnimatedCircle cx={55.2} cy={137.1} r={15} fill={ORANGE} animatedProps={tail} />
            <AnimatedRect
              x={108}
              y={-6}
              width={24}
              height={24}
              rx={4}
              transform="rotate(45 120 6)"
              fill={SUN}
              animatedProps={diamond}
            />
          </G>
        </Svg>
      </Animated.View>
      {message ? (
        <Text size="sm" tone="muted" className="text-center">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
