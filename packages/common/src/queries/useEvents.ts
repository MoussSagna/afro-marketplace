import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EventInput, RequestEventQuotesInput } from '../types';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

/**
 * Planificateur d'événements. Après chaque changement, on recharge les événements ; après un envoi
 * de devis, aussi les demandes et les conversations (de nouvelles demandes viennent d'être créées).
 */
function useInvalidateEvents() {
  const queryClient = useQueryClient();
  return (alsoRequests = false) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
      ...(alsoRequests
        ? [
            queryClient.invalidateQueries({ queryKey: queryKeys.quoteRequests.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all }),
          ]
        : []),
    ]);
}

/** « Mes événements ». `enabled: false` pour ne rien charger (visiteur non connecté). */
export function useEvents({ enabled = true }: { enabled?: boolean } = {}) {
  const api = useApiClient();
  return useQuery({ queryKey: queryKeys.events.list(), queryFn: () => api.listEvents(), enabled });
}

/** Le détail d'un événement. Rien n'est chargé tant que l'id est vide. */
export function useEvent(eventId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => api.getEvent(eventId),
    enabled: eventId !== '',
  });
}

export function useCreateEvent() {
  const api = useApiClient();
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (input: EventInput) => api.createEvent(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateEvent(eventId: string) {
  const api = useApiClient();
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (input: EventInput) => api.updateEvent(eventId, input),
    onSuccess: () => invalidate(),
  });
}

/**
 * Supprimer : on marque les événements « à recharger » sans les recharger tout de suite
 * (`refetchType: 'none'`). Le détail affiché n'existe plus : le recharger donnerait une 404
 * avant le retour à la liste, qui, elle, se recharge en s'affichant.
 */
export function useDeleteEvent() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => api.deleteEvent(eventId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all, refetchType: 'none' }),
  });
}

export function useRestoreEvent() {
  const api = useApiClient();
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (eventId: string) => api.restoreEvent(eventId),
    onSuccess: () => invalidate(),
  });
}

/** Ajouter un prestataire : depuis l'événement (`eventId` fixe) ou depuis une fiche (choix de l'événement). */
export function useAddEventProvider() {
  const api = useApiClient();
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: ({ eventId, providerId }: { eventId: string; providerId: string }) =>
      api.addEventProvider(eventId, providerId),
    onSuccess: () => invalidate(),
  });
}

export function useRemoveEventProvider(eventId: string) {
  const api = useApiClient();
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (providerId: string) => api.removeEventProvider(eventId, providerId),
    onSuccess: () => invalidate(),
  });
}

export function useRequestEventQuotes(eventId: string) {
  const api = useApiClient();
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (input: RequestEventQuotesInput) => api.requestEventQuotes(eventId, input),
    onSuccess: () => invalidate(true),
  });
}

export function useSetEventProviderRetained(eventId: string) {
  const api = useApiClient();
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: ({ providerId, retained }: { providerId: string; retained: boolean }) =>
      api.setEventProviderRetained(eventId, providerId, retained),
    onSuccess: () => invalidate(),
  });
}
