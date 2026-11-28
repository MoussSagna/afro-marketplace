import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { CONVERSATION_AVATAR } from './ConversationItem';

const ROWS = 7;

/**
 * Pendant le chargement : des lignes grises de la forme d'une conversation (avatar, nom,
 * catégorie, aperçu, date), qui « respirent » doucement (immobiles si « Réduire les animations »).
 */
export function ConversationSkeleton() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.45, { duration: 750 }), -1, true);
  }, [opacity, reduceMotion]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('messages.loading')}
      style={pulse}
      testID="conversations-skeleton"
    >
      {Array.from({ length: ROWS }, (_, index) => (
        <View
          key={index}
          className="flex-row items-center gap-3.5 border-b border-border py-3.5 pl-5 pr-5"
        >
          <View
            className="rounded-full bg-muted"
            style={{ width: CONVERSATION_AVATAR, height: CONVERSATION_AVATAR }}
          />
          <View className="flex-1 gap-2">
            <View className="h-4 w-2/5 rounded-full bg-muted" />
            <View className="h-3 w-1/3 rounded-full bg-muted" />
            <View className="h-3 w-4/5 rounded-full bg-muted" />
          </View>
          <View className="h-3 w-10 self-start rounded-full bg-muted" />
        </View>
      ))}
    </Animated.View>
  );
}
