import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Side } from '../api';
import type { CreateReportInput, Message, SendMessageInput } from '../types';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

/**
 * Fréquence de rafraîchissement de la messagerie : pas de temps réel au MVP,
 * on redemande simplement au serveur toutes les 7 secondes (« polling »).
 * Le vrai temps réel (Supabase Realtime) arrivera au lot 10.
 */
export const MESSAGING_REFRESH_MS = 7_000;

/** Les conversations d'un côté (C4 / S5), rafraîchies régulièrement. */
export function useConversations(side: Side) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.conversations.list(side),
    queryFn: () => api.listConversations(side),
    refetchInterval: MESSAGING_REFRESH_MS,
  });
}

/** Le nombre total de messages non lus d'un côté (pastille du menu). */
export function useUnreadCount(side: Side) {
  const { data } = useConversations(side);
  return data?.reduce((total, c) => total + c.unreadCount, 0) ?? 0;
}

/** Les messages d'une conversation, rafraîchis régulièrement. */
export function useMessages(conversationId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.conversations.messages(conversationId),
    queryFn: () => api.listMessages(conversationId),
    refetchInterval: MESSAGING_REFRESH_MS,
  });
}

/** Envoyer un message. Le message renvoyé (éventuellement masqué) est ajouté tout de suite au fil. */
export function useSendMessage(conversationId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) => api.sendMessage(conversationId, input),
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(
        queryKeys.conversations.messages(conversationId),
        (messages) => [...(messages ?? []), message],
      );
      // On ne renvoie PAS ces promesses : l'envoi est fini dès que le serveur a répondu,
      // sans attendre le rechargement des listes (sinon la zone d'écriture reste pleine).
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.quoteRequests.all });
    },
  });
}

/** Marquer une conversation comme lue (à l'ouverture du fil). */
export function useMarkConversationRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => api.markConversationRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all }),
  });
}

/** Signaler un contenu (message, profil, avis…). */
export function useCreateReport() {
  const api = useApiClient();
  return useMutation({ mutationFn: (input: CreateReportInput) => api.createReport(input) });
}
