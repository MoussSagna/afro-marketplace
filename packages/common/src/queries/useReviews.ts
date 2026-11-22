import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateReviewInput, ReplyToReviewInput } from '../types';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

/**
 * C6 : laisser un avis. Après coup, la note du prestataire change (règle n° 8) :
 * on recharge ses profils publics, les réservations (le bouton disparaît)
 * et le tableau de bord du prestataire.
 */
export function useCreateReview() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => api.createReview(input),
    onSuccess: () =>
      Promise.all(
        [queryKeys.bookings.all, queryKeys.providers.all, queryKeys.myProvider.all].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

/** S8 : les avis reçus par le prestataire connecté. */
export function useMyReviews() {
  const api = useApiClient();
  return useQuery({ queryKey: queryKeys.myProvider.reviews(), queryFn: () => api.listMyReviews() });
}

/** S8 : la réponse publique (une seule) à un avis. */
export function useReplyToReview(reviewId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReplyToReviewInput) => api.replyToReview(reviewId, input),
    onSuccess: () =>
      Promise.all(
        [queryKeys.myProvider.all, queryKeys.providers.all].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}
