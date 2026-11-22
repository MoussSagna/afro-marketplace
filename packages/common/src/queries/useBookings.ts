import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Side } from '../api';
import type { AcceptQuoteInput, CancelBookingInput, CreateQuoteInput } from '../types';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

/**
 * Un devis accepté ou une réservation annulée touchent beaucoup d'écrans :
 * demandes, messages (message système), réservations, tableau de bord, agenda.
 * On recharge tout ce petit monde.
 */
function useInvalidateDeals() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [
        queryKeys.quoteRequests.all,
        queryKeys.conversations.all,
        queryKeys.bookings.all,
        queryKeys.myProvider.all,
        queryKeys.providers.all,
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
}

/** S4 : envoyer un devis (ou une nouvelle version). */
export function useCreateQuote() {
  const api = useApiClient();
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (input: CreateQuoteInput) => api.createQuote(input),
    onSuccess: invalidate,
  });
}

/** C3 : accepter un devis (règle n° 5). */
export function useAcceptQuote(quoteId: string) {
  const api = useApiClient();
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (input: AcceptQuoteInput) => api.acceptQuote(quoteId, input),
    onSuccess: invalidate,
  });
}

/** C3 : refuser un devis. */
export function useDeclineQuote(quoteId: string) {
  const api = useApiClient();
  const invalidate = useInvalidateDeals();
  return useMutation({ mutationFn: () => api.declineQuote(quoteId), onSuccess: invalidate });
}

/** Mes réservations (client) ou les réservations reçues (prestataire). */
export function useBookings(side: Side) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.bookings.list(side),
    queryFn: () => api.listBookings(side),
  });
}

export function useCancelBooking(bookingId: string) {
  const api = useApiClient();
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (input: CancelBookingInput) => api.cancelBooking(bookingId, input),
    onSuccess: invalidate,
  });
}

/** S2 : le tableau de bord du prestataire connecté. */
export function useProviderDashboard() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.myProvider.dashboard(),
    queryFn: () => api.getProviderDashboard(),
  });
}

/** S6 : les dates bloquées (à la main ou par une réservation) sur une période. */
export function useMyUnavailabilities(range: { from: string; to: string }) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.myProvider.unavailabilities(range),
    queryFn: () => api.listMyUnavailabilities(range),
  });
}

export function useBlockDate() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => api.blockDate(date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myProvider.all }),
  });
}

export function useUnblockDate() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (unavailabilityId: string) => api.unblockDate(unavailabilityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myProvider.all }),
  });
}
