import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * true si « Réduire les animations » est activé sur le téléphone (suit les changements).
 * Version React Native de base, pour les composants animés sans Reanimated.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduce(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduce;
}
