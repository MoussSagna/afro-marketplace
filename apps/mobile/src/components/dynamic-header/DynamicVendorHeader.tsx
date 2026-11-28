import { BlurView } from 'expo-blur';
import { ChevronLeft, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { useColorSchemeName, useThemeColors } from '@/theme/useTheme';
import { HEADER_BAR_HEIGHT, type DynamicHeaderState } from './useDynamicHeader';

const INK = '#2B1A12';
/** Taille des deux ronds (et de leur zone tactile, agrandie par hitSlop). */
const BUTTON_SIZE = 44;
/** Le titre monte de quelques points en apparaissant : il « remonte » dans la barre. */
const TITLE_RISE = 8;
/**
 * Le voile arrive avant le titre (validation, cycle 2) : complet à 40 % de la progression,
 * alors que le titre ne commence qu'à 25 %. Le nom ne se pose jamais sur un fond encore transparent.
 */
const VEIL_RANGE = [0, 0.4];
const TITLE_RANGE = [0.25, 1];

/** Le voile du header : léger, pour garder la photo visible tout en rendant le titre lisible. */
const VEIL = {
  light: { tint: 'light', color: 'rgba(253, 247, 240, 0.62)', edge: 'rgba(43, 26, 18, 0.08)' },
  dark: { tint: 'dark', color: 'rgba(38, 25, 18, 0.62)', edge: 'rgba(235, 217, 198, 0.12)' },
} as const;

type DynamicVendorHeaderProps = DynamicHeaderState & {
  /** Le nom affiché au centre quand le titre principal est sorti de l'écran (une ligne, « … » si trop long). */
  title: string;
  onBack(): void;
  isFavorite: boolean;
  onToggleFavorite(): void;
};

/**
 * Le header en surimpression des fiches prestataires.
 * - En haut de page : les ronds Retour (clair) et Favori (sombre) posés sur la photo, sans titre ni fond.
 * - En défilant : le nom fond et remonte doucement au centre, sur un voile translucide (flou sur iPhone).
 * - Les deux boutons ne bougent jamais.
 * Ne connaît aucun prestataire : il reçoit un titre, l'état du favori et deux actions.
 * La progression vient de `useDynamicHeader` (aucun re-render pendant le scroll).
 */
export function DynamicVendorHeader({
  title,
  progress,
  safeAreaTop,
  onBack,
  isFavorite,
  onToggleFavorite,
}: DynamicVendorHeaderProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const veil = VEIL[useColorSchemeName()];

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, VEIL_RANGE, [0, 1], Extrapolation.CLAMP),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, TITLE_RANGE, [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [TITLE_RISE, 0]) }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { height: safeAreaTop + HEADER_BAR_HEIGHT }]}
      testID="dynamic-header"
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, backgroundStyle]}
        testID="dynamic-header-background"
      >
        <BlurView intensity={40} tint={veil.tint} style={StyleSheet.absoluteFill} />
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.veil,
            { backgroundColor: veil.color, borderBottomColor: veil.edge },
          ]}
        />
      </Animated.View>

      <View pointerEvents="box-none" style={[styles.bar, { marginTop: safeAreaTop }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={6}
          onPress={onBack}
          className="items-center justify-center rounded-full active:opacity-70"
          style={[styles.button, { backgroundColor: 'rgba(253, 247, 240, 0.92)' }]}
        >
          <ChevronLeft size={22} color={INK} />
        </Pressable>

        {/* Doublon visuel du titre principal : caché aux lecteurs d'écran (le vrai titre est dans la page). */}
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.title, titleStyle]}
          testID="dynamic-header-title"
        >
          <Text weight="bold" numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </Animated.View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(isFavorite ? 'favorites.remove' : 'favorites.add', {
            name: title,
          })}
          accessibilityState={{ selected: isFavorite }}
          hitSlop={6}
          onPress={onToggleFavorite}
          className="items-center justify-center rounded-full active:opacity-70"
          style={[styles.button, { backgroundColor: 'rgba(43, 26, 18, 0.45)' }]}
        >
          <Heart
            size={21}
            strokeWidth={2}
            color="#fff"
            fill={isFavorite ? colors.primary : 'transparent'}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0 },
  veil: { borderBottomWidth: StyleSheet.hairlineWidth },
  bar: {
    height: HEADER_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  // Ombre douce + liseré : le rond clair reste visible sur le voile crème (validation, cycle 1).
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(43, 26, 18, 0.12)',
    boxShadow: '0 2px 8px rgba(43, 26, 18, 0.18)',
  },
  title: { flex: 1, alignItems: 'center' },
});
