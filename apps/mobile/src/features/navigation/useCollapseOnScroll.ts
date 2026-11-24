import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useTabBarStore } from './tabBarStore';

/** On ignore les tout petits mouvements (le doigt qui tremble). */
const MIN_DELTA = 8;
/** En haut de l'écran, la barre reste toujours dépliée. */
const TOP_ZONE = 40;

/** La décision, à part pour pouvoir la tester : « collapse », « expand » ou rien. */
export function scrollDecision(previousY: number, y: number): 'collapse' | 'expand' | null {
  if (y <= TOP_ZONE) return 'expand';
  const delta = y - previousY;
  if (delta > MIN_DELTA) return 'collapse';
  if (delta < -MIN_DELTA) return 'expand';
  return null;
}

/**
 * À brancher sur le `onScroll` d'une ScrollView ou d'une FlatList d'un onglet :
 * on descend → la barre se rétracte en rond ; on remonte → elle revient.
 */
export function useCollapseOnScroll() {
  const lastY = useRef(0);
  return useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const decision = scrollDecision(lastY.current, y);
    if (decision === null) return;
    lastY.current = y;
    const { collapsed, collapse, expand } = useTabBarStore.getState();
    if (decision === 'collapse' && !collapsed) collapse();
    if (decision === 'expand' && collapsed) expand();
  }, []);
}
