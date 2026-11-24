import type { Session } from '@afro/common';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useSessionStore } from '@/stores/session';
import { useAuthFlowStore } from './authFlowStore';

/**
 * Les deux gestes de fin de parcours, partagés par tous les écrans de connexion :
 * - `openSession(session)` : on range la session (et on vide le cache, qui appartenait
 *   peut-être à quelqu'un d'autre), comme le fait le site.
 * - `leaveAuth()` : on ferme les écrans de connexion et on revient où on était.
 */
export function useFinishAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signIn = useSessionStore((s) => s.signIn);

  const openSession = useCallback(
    (session: Session) => {
      queryClient.clear();
      signIn(session);
    },
    [queryClient, signIn],
  );

  const leaveAuth = useCallback(() => {
    const target = useAuthFlowStore.getState().takeRedirect();
    // Ferme toute la pile d'écrans de connexion, puis ouvre l'écran d'origine.
    if (router.canDismiss()) router.dismissAll();
    router.replace(target as never);
  }, [router]);

  return { openSession, leaveAuth };
}
