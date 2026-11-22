import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Side } from '../api';
import type { CreateQuoteRequestInput, DeclineQuoteRequestInput } from '../types';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

/** Mes demandes (C2) ou les demandes reçues (S3). */
export function useQuoteRequests(side: Side) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.quoteRequests.list(side),
    queryFn: () => api.listQuoteRequests(side),
  });
}

/** Le détail d'une demande (C3 / S3). Rien n'est chargé tant que l'id est vide. */
export function useQuoteRequest(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.quoteRequests.detail(id),
    queryFn: () => api.getQuoteRequest(id),
    enabled: id !== '',
  });
}

/**
 * Après un changement sur une demande, on recharge les demandes ET les
 * conversations (un message système vient d'y être posté).
 */
function useInvalidateRequests() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.quoteRequests.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all }),
    ]);
}

/** Envoyer une demande de devis (C1). */
export function useCreateQuoteRequest() {
  const api = useApiClient();
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: (input: CreateQuoteRequestInput) => api.createQuoteRequest(input),
    onSuccess: invalidate,
  });
}

/** Le prestataire décline une demande, avec un motif (S3). */
export function useDeclineQuoteRequest(id: string) {
  const api = useApiClient();
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: (input: DeclineQuoteRequestInput) => api.declineQuoteRequest(id, input),
    onSuccess: invalidate,
  });
}

/** Le client annule sa demande (C3). */
export function useCancelQuoteRequest(id: string) {
  const api = useApiClient();
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: () => api.cancelQuoteRequest(id),
    onSuccess: invalidate,
  });
}
