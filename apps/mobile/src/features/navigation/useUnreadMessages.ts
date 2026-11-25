import { MESSAGING_REFRESH_MS, queryKeys, useApiClient, type Side } from '@afro/common';
import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/stores/session';

/**
 * Le nombre de messages non lus d'un côté (client ou prestataire), pour la pastille de l'onglet
 * « Messages ». Même requête (et même cache) que `useUnreadCount` de common, mais seulement
 * quand quelqu'un est connecté (et prestataire, côté pro) : sinon le faux serveur répondrait
 * « non connecté » ou « interdit » toutes les 7 s.
 */
export function useUnreadMessages(side: Side): number {
  const api = useApiClient();
  const allowed = useSessionStore((state) =>
    side === 'provider' ? (state.user?.roles.includes('provider') ?? false) : Boolean(state.token),
  );
  const { data } = useQuery({
    queryKey: queryKeys.conversations.list(side),
    queryFn: () => api.listConversations(side),
    refetchInterval: MESSAGING_REFRESH_MS,
    enabled: allowed,
  });
  if (!allowed) return 0;
  return data?.reduce((total, conversation) => total + conversation.unreadCount, 0) ?? 0;
}
