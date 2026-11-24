import { MESSAGING_REFRESH_MS, queryKeys, useApiClient } from '@afro/common';
import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/stores/session';

/**
 * Le nombre de messages non lus côté client, pour la pastille de l'onglet « Messages ».
 * Même requête (et même cache) que `useUnreadCount` de common, mais seulement quand
 * quelqu'un est connecté : sinon le faux serveur répondrait « non connecté » toutes les 7 s.
 */
export function useClientUnreadCount(): number {
  const api = useApiClient();
  const signedIn = useSessionStore((state) => Boolean(state.token));
  const { data } = useQuery({
    queryKey: queryKeys.conversations.list('client'),
    queryFn: () => api.listConversations('client'),
    refetchInterval: MESSAGING_REFRESH_MS,
    enabled: signedIn,
  });
  if (!signedIn) return 0;
  return data?.reduce((total, conversation) => total + conversation.unreadCount, 0) ?? 0;
}
