import { useCallback, useRef, type ComponentRef } from 'react';
import type { View } from 'react-native';
import {
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** La hauteur de la barre du header, sous la zone de l'encoche (Safe Area). */
export const HEADER_BAR_HEIGHT = 56;
/** Le fondu dure au moins cette distance de défilement, même pour un titre court (pas d'apparition brutale). */
export const MIN_FADE_DISTANCE = 40;

/**
 * La progression du titre dans le header, de 0 (titre principal visible) à 1 (titre principal caché).
 * Elle suit la position réelle du titre dans la page, pas un seuil fixe :
 * - 0 tant que le titre principal est entièrement sous le header ;
 * - 1 dès que son bas passe derrière le header ;
 * - entre les deux, le fondu (sur la hauteur du titre, au moins MIN_FADE_DISTANCE).
 * Une « worklet » : elle tourne sur le fil des animations, sans re-render React.
 */
export function titleRevealProgress(
  scrollY: number,
  titleTop: number,
  titleHeight: number,
  headerBottom: number,
): number {
  'worklet';
  if (titleHeight <= 0) return 0; // pas encore mesuré : le header reste sans titre
  const end = titleTop + titleHeight - headerBottom; // le bas du titre touche le bas du header
  const start = end - Math.max(titleHeight, MIN_FADE_DISTANCE);
  if (scrollY <= start) return 0;
  if (scrollY >= end) return 1;
  return (scrollY - start) / (end - start);
}

/** Ce que l'écran donne au header : la progression et la Safe Area du haut. */
export interface DynamicHeaderState {
  progress: SharedValue<number>;
  safeAreaTop: number;
}

/**
 * Toute la logique de défilement du header dynamique, pour ne pas la recopier dans chaque fiche.
 *
 * ```tsx
 * const header = useDynamicHeader();
 * <Animated.ScrollView {...header.scrollProps}>
 *   <View {...header.contentProps}>
 *     …
 *     <View {...header.titleProps}><Heading>{name}</Heading></View>
 *   </View>
 * </Animated.ScrollView>
 * <DynamicVendorHeader {...header.headerProps} title={name} … />
 * ```
 *
 * - `scrollProps` : le suivi du scroll (Reanimated, sur le fil des animations : aucun re-render).
 * - `contentProps` : le bloc qui contient toute la page (le repère des mesures).
 * - `titleProps` : autour du titre principal ; mesuré avec `onLayout` à chaque changement de mise en page.
 */
export function useDynamicHeader() {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const titleTop = useSharedValue(0);
  const titleHeight = useSharedValue(0);
  const contentRef = useRef<ComponentRef<typeof View>>(null);
  const titleRef = useRef<ComponentRef<typeof View>>(null);
  const headerBottom = insets.top + HEADER_BAR_HEIGHT;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  /** La position du titre dans la page (pas dans son parent) : mesurée par rapport au bloc de contenu. */
  const measureTitle = useCallback(() => {
    const title = titleRef.current;
    const content = contentRef.current;
    if (!title || !content || typeof title.measureLayout !== 'function') return;
    title.measureLayout(
      content,
      (_x, y, _width, height) => {
        titleTop.value = y;
        titleHeight.value = height;
      },
      () => {},
    );
  }, [titleTop, titleHeight]);

  const progress = useDerivedValue(() =>
    titleRevealProgress(scrollY.value, titleTop.value, titleHeight.value, headerBottom),
  );

  return {
    scrollProps: { onScroll, scrollEventThrottle: 16 },
    contentProps: { ref: contentRef, onLayout: measureTitle, collapsable: false },
    titleProps: { ref: titleRef, onLayout: measureTitle, collapsable: false },
    headerProps: { progress, safeAreaTop: insets.top } satisfies DynamicHeaderState,
  };
}
