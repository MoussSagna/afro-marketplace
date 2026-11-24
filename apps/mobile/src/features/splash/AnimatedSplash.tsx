import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  Mask,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { Text } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';
import { ARCH_LEFT, ARCH_RIGHT, LENGTHS, WEAVE, WORDMARK } from '@/components/brand/logoPaths';

/** Durée de l'animation complète (la maquette faisait 4 s ; on garde les mêmes étapes, en 3,2 s). */
export const SPLASH_DURATION_MS = 3200;
/** Avec « Réduire les animations » : logo complet tout de suite, affiché un court instant. */
export const SPLASH_REDUCED_MS = 900;

const CREAM = '#FDF7F0';
const ORANGE = '#F0A422';
const SUN = '#F3B618';
const EARTH = '#7A1F0E';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * Chaque élément suit la même horloge `t` (de 0 à 1) avec ses propres étapes,
 * comme les @keyframes de la maquette : `between(t, 0.14, 0.36)` vaut 0 avant 14 %,
 * 1 après 36 %, et progresse entre les deux.
 */
function between(t: number, start: number, end: number) {
  'worklet';
  return interpolate(t, [start, end], [0, 1], 'clamp');
}

/** Un trait qui se dessine : le pointillé glisse de toute sa longueur à zéro. */
function useDrawProps(t: SharedValue<number>, length: number, start: number, end: number) {
  return useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - between(t.value, start, end)),
  }));
}

function LoaderDot({ delay, still }: { delay: number; still: boolean }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 500 })),
        -1,
      ),
    );
  }, [delay, still, y]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.5 + y.value * 0.5,
    transform: [{ translateY: -5 * y.value }],
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

type AnimatedSplashProps = {
  /** Appelé quand l'animation est finie : l'app retire alors le splash. */
  onFinish: () => void;
};

/**
 * Le splash animé de Wenzee (maquette, section 0). Il prend le relais de l'écran
 * de démarrage natif (même fond terre, même symbole), puis :
 * soleil qui se lève → le W se dessine → le lien orange le tisse → le losange apparaît
 * → le nom et la phrase → la frise → fondu vers l'app.
 * Si « Réduire les animations » est activé sur le téléphone : logo complet, sans mouvement.
 */
export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const reduceMotion = useReducedMotion();
  const { t: translate } = useTranslation();
  // Le fondu final va vers le fond de l'app : crème en thème clair, brun en thème sombre.
  const appBackground = useThemeColors().background;
  // L'horloge commune. 0,6 = tout est affiché, avant le fondu (état « figé »).
  const t = useSharedValue(reduceMotion ? 0.6 : 0);

  useEffect(() => {
    if (!reduceMotion) {
      t.value = withTiming(1, { duration: SPLASH_DURATION_MS, easing: Easing.linear });
    }
    const timer = setTimeout(onFinish, reduceMotion ? SPLASH_REDUCED_MS : SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onFinish, reduceMotion, t]);

  const archLeft = useDrawProps(t, LENGTHS.archLeft, 0, 0.22);
  const archRight = useDrawProps(t, LENGTHS.archRight, 0, 0.22);
  const weave = useDrawProps(t, LENGTHS.weave, 0.14, 0.36);
  const tail = useAnimatedProps(() => ({ opacity: between(t.value, 0.35, 0.36) }));
  const diamond = useAnimatedProps(() => ({ opacity: between(t.value, 0.26, 0.36) }));

  const sun = useAnimatedStyle(() => ({
    opacity: between(t.value, 0, 0.25),
    transform: [{ scale: interpolate(t.value, [0, 0.55], [0.3, 1.15], 'clamp') }],
  }));
  const word = useAnimatedStyle(() => ({
    opacity: between(t.value, 0.3, 0.45),
    transform: [{ translateY: 14 * (1 - between(t.value, 0.3, 0.45)) }],
  }));
  const tagline = useAnimatedStyle(() => ({ opacity: between(t.value, 0.48, 0.6) }));
  const strip = useAnimatedStyle(() => ({
    transform: [{ scaleX: between(t.value, 0.42, 0.58) }],
  }));
  const fadeOut = useAnimatedStyle(() => ({ opacity: between(t.value, 0.82, 0.95) }));

  return (
    <View
      style={StyleSheet.absoluteFill}
      accessible
      accessibilityRole="image"
      accessibilityLabel={translate('splash.label')}
      testID="animated-splash"
    >
      {/* Le fond terre, plus chaud au centre (dégradé radial de la maquette). */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="splash-bg" cx="50%" cy="42%" r="75%">
            <Stop offset="0" stopColor="#93301A" />
            <Stop offset="0.45" stopColor={EARTH} />
            <Stop offset="1" stopColor="#5A1508" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#splash-bg)" />
      </Svg>

      <View style={styles.center}>
        {/* Le soleil qui se lève derrière le logo. */}
        <Animated.View style={[styles.sun, sun]}>
          <Svg width={260} height={260}>
            <Defs>
              <RadialGradient id="splash-sun" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={SUN} stopOpacity={0.35} />
                <Stop offset="0.7" stopColor={SUN} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={130} cy={130} r={130} fill="url(#splash-sun)" />
          </Svg>
        </Animated.View>

        {/* Le symbole : le W, le lien orange et le losange. */}
        <Svg width={250} height={150} viewBox="0 0 500 300">
          <Defs>
            <Mask
              id="splash-gap"
              maskUnits="userSpaceOnUse"
              x="-20"
              y="-40"
              width="280"
              height="240"
            >
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
          <G
            transform="translate(250 140) scale(1.45) translate(-120 -78)"
            fill="none"
            strokeWidth={30}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <AnimatedPath
              d={ARCH_LEFT}
              stroke={CREAM}
              strokeDasharray={[LENGTHS.archLeft, LENGTHS.archLeft]}
              mask="url(#splash-gap)"
              animatedProps={archLeft}
            />
            <AnimatedPath
              d={ARCH_RIGHT}
              stroke={CREAM}
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

        {/* Le nom. */}
        <Animated.View style={word}>
          <Svg width={250} height={50} viewBox="0 330 500 100">
            <Path d={WORDMARK} fill={CREAM} />
          </Svg>
        </Animated.View>

        <Animated.View style={tagline}>
          <Text size="sm" className="mt-5 tracking-wide text-secondary">
            {translate('splash.tagline')}
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.loader, tagline]}>
        {[0, 150, 300].map((delay) => (
          <LoaderDot key={delay} delay={delay} still={reduceMotion} />
        ))}
      </Animated.View>

      {/* La frise en dents de scie, en bas de l'écran. */}
      <Animated.View style={[styles.strip, strip]}>
        <Svg width="100%" height={16}>
          <Defs>
            <Pattern id="splash-strip" width={16} height={16} patternUnits="userSpaceOnUse">
              <Path d="M0 16 L8 6 L16 16 Z" fill={SUN} />
            </Pattern>
          </Defs>
          <Rect width="100%" height={16} fill="url(#splash-strip)" />
        </Svg>
      </Animated.View>

      {/* Le fondu vers la couleur de fond de l'app. */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: appBackground }, fadeOut]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sun: { position: 'absolute', top: '30%' },
  loader: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: SUN },
  strip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 16, opacity: 0.8 },
});
