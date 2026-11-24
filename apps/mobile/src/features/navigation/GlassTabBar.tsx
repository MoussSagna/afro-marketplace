import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/tabs';
import {
  House,
  Inbox,
  MessageCircle,
  Search,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useColorSchemeName } from '@/theme/useTheme';
import { useTabBarStore } from './tabBarStore';

/** Les deux verres de la maquette : clair (section 6) et fumé (thème sombre, section 7). */
const GLASS = {
  light: {
    tint: 'light',
    active: '#7A1F0E',
    inactive: '#4D3426',
    veil: 'rgba(255, 255, 255, 0.45)',
    edge: 'rgba(255, 255, 255, 0.6)',
    activeBackground: 'rgba(255, 255, 255, 0.7)',
    shadow: '0 10px 30px rgba(43, 26, 18, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    badgeEdge: '#FFFFFF',
  },
  dark: {
    tint: 'dark',
    active: '#F3B618',
    inactive: '#C4A68E',
    veil: 'rgba(38, 25, 18, 0.62)',
    edge: 'rgba(235, 217, 198, 0.14)',
    activeBackground: 'rgba(255, 255, 255, 0.1)',
    shadow: '0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
    badgeEdge: '#261912',
  },
} as const;
const SUN = '#F3B618'; // accent : la pastille de non-lus
const INK = '#2B1A12';

/** Dimensions de la barre dépliée et du rond. */
const BAR_HEIGHT = 66;
const BALL_SIZE = 60;
const SIDE_MARGIN = 16;
/** Place à laisser en bas des écrans pour que la barre ne cache pas la fin du contenu. */
export const TAB_BAR_SPACE = BAR_HEIGHT + 40;

/** L'icône de chaque onglet (nom du fichier dans app/(tabs)/). */
const ICONS: Record<string, LucideIcon> = {
  index: House,
  recherche: Search,
  demandes: Inbox,
  messages: MessageCircle,
  compte: UserRound,
};

function Badge({ count, edge, inBall = false }: { count: number; edge: string; inBall?: boolean }) {
  return (
    <View
      style={[styles.badge, { borderColor: edge }, inBall && styles.badgeInBall]}
      importantForAccessibility="no"
    >
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

/**
 * La barre d'onglets en verre (maquette section 6, demande de Mouss du 24/11/2026).
 * - Dépliée : une pilule flottante translucide (flou de ce qui passe derrière), onglet actif en pastille claire.
 *   Icônes seules, sans texte (demande de Mouss du 24/11) : le nom de l'onglet reste lu par VoiceOver / TalkBack.
 * - Rétractée (on fait défiler vers le bas) : un rond qui ne garde que l'onglet actif et sa pastille.
 *   Toucher le rond, ou remonter, la redéplie.
 * - « Réduire les animations » : elle change d'état sans mouvement.
 * - Thème sombre : verre fumé, onglet actif en soleil (maquette section 7).
 * Le flou vient d'expo-blur : réel sur iPhone ; sur Android, un voile translucide sans flou.
 */
export function GlassTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const collapsed = useTabBarStore((s) => s.collapsed);
  const expand = useTabBarStore((s) => s.expand);
  const reduceMotion = useReduceMotion();
  const glass = GLASS[useColorSchemeName()];
  const { t } = useTranslation();
  const fullWidth = width - SIDE_MARGIN * 2;

  // 0 = dépliée, 1 = rond. Animated de React Native (la largeur ne passe pas par le fil natif).
  const [progress] = useState(() => new Animated.Value(collapsed ? 1 : 0));
  useEffect(() => {
    const toValue = collapsed ? 1 : 0;
    if (reduceMotion) {
      progress.setValue(toValue);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue,
      duration: 450,
      easing: Easing.bezier(0.65, 0, 0.35, 1),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [collapsed, progress, reduceMotion]);

  // Changer d'onglet redéplie toujours la barre.
  useEffect(() => {
    expand();
  }, [state.index, expand]);

  const barStyle = {
    width: progress.interpolate({ inputRange: [0, 1], outputRange: [fullWidth, BALL_SIZE] }),
    height: progress.interpolate({ inputRange: [0, 1], outputRange: [BAR_HEIGHT, BALL_SIZE] }),
  };
  const tabsStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 0.4],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    }),
  };
  const ballStyle = {
    opacity: progress.interpolate({
      inputRange: [0.6, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
  };

  const activeRoute = state.routes[state.index]!;
  const activeOptions = descriptors[activeRoute.key]!.options;
  const ActiveIcon = ICONS[activeRoute.name] ?? House;
  const activeBadge = Number(activeOptions.tabBarBadge ?? 0);

  return (
    <Animated.View
      style={[
        styles.bar,
        { bottom: insets.bottom + 10, borderColor: glass.edge, boxShadow: glass.shadow },
        barStyle,
      ]}
      testID="glass-tab-bar"
    >
      {/* Le verre : flou + voile clair + reflet en haut. */}
      <BlurView intensity={50} tint={glass.tint} style={StyleSheet.absoluteFill} />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: glass.veil }]}
        pointerEvents="none"
      />

      {/* Les 5 onglets (barre dépliée). */}
      <Animated.View
        style={[styles.tabs, { width: fullWidth }, tabsStyle]}
        pointerEvents={collapsed ? 'none' : 'auto'}
        accessibilityRole="tablist"
        accessibilityElementsHidden={collapsed}
        importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          const focused = index === state.index;
          const Icon = ICONS[route.name] ?? House;
          const label = options.title ?? route.name;
          const badge = Number(options.tabBarBadge ?? 0);
          const color = focused ? glass.active : glass.inactive;
          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              style={[
                styles.tab,
                focused && [styles.tabActive, { backgroundColor: glass.activeBackground }],
              ]}
            >
              <Icon size={24} color={color} strokeWidth={focused ? 2.4 : 2} />
              {badge > 0 ? <Badge count={badge} edge={glass.badgeEdge} /> : null}
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Le rond (barre rétractée) : l'onglet actif seulement. */}
      <Animated.View
        style={[styles.ball, ballStyle]}
        pointerEvents={collapsed ? 'auto' : 'none'}
        accessibilityElementsHidden={!collapsed}
        importantForAccessibility={collapsed ? 'auto' : 'no-hide-descendants'}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.showTabs', { tab: activeOptions.title ?? activeRoute.name })}
          onPress={expand}
          style={styles.ballButton}
        >
          <ActiveIcon size={26} color={glass.active} strokeWidth={2.4} />
          {activeBadge > 0 ? <Badge count={activeBadge} edge={glass.badgeEdge} inBall /> : null}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: SIDE_MARGIN,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tabs: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  tab: {
    width: 56,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  tabActive: {
    boxShadow: '0 2px 8px rgba(43, 26, 18, 0.08), inset 0 1px 0 #FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    backgroundColor: SUN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInBall: { top: 6, right: 4 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: INK },
  ball: { position: 'absolute', left: 0, top: 0, width: BALL_SIZE, height: BALL_SIZE },
  ballButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
