import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MediaInput, OfferingInput, UpdateProviderProfileInput } from '../types';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

/**
 * Le profil du prestataire connecté : onboarding (S1), « Modifier mon profil » (S7),
 * formules et galerie. Toute modification recharge aussi les profils publics
 * (le « à partir de », la couverture ou la note y sont affichés).
 */
function useInvalidateMyProvider() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [queryKeys.myProvider.all, queryKeys.providers.all].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

/** Le profil du prestataire connecté (champs internes compris), ses formules et sa galerie. */
export function useMyProviderProfile(options: { enabled?: boolean } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.myProvider.profile(),
    queryFn: () => api.getMyProviderProfile(),
    enabled: options.enabled ?? true,
  });
}

/** P6 : « Créer mon profil » donne le rôle prestataire et un profil brouillon. */
export function useStartProviderOnboarding() {
  const api = useApiClient();
  const invalidate = useInvalidateMyProvider();
  return useMutation({ mutationFn: () => api.startProviderOnboarding(), onSuccess: invalidate });
}

export function useUpdateMyProviderProfile() {
  const api = useApiClient();
  const invalidate = useInvalidateMyProvider();
  return useMutation({
    mutationFn: (input: UpdateProviderProfileInput) => api.updateMyProviderProfile(input),
    onSuccess: invalidate,
  });
}

/** Règle n° 2 : refusé (422) tant que le profil est incomplet. */
export function useSubmitMyProviderProfile() {
  const api = useApiClient();
  const invalidate = useInvalidateMyProvider();
  return useMutation({ mutationFn: () => api.submitMyProviderProfile(), onSuccess: invalidate });
}

export function useSetMyProviderProfilePaused() {
  const api = useApiClient();
  const invalidate = useInvalidateMyProvider();
  return useMutation({
    mutationFn: (paused: boolean) => api.setMyProviderProfilePaused(paused),
    onSuccess: invalidate,
  });
}

export function useSaveOffering() {
  const api = useApiClient();
  const invalidate = useInvalidateMyProvider();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: OfferingInput }) =>
      id ? api.updateOffering(id, input) : api.createOffering(input),
    onSuccess: invalidate,
  });
}

export function useDeleteOffering() {
  const api = useApiClient();
  const invalidate = useInvalidateMyProvider();
  return useMutation({
    mutationFn: (offeringId: string) => api.deleteOffering(offeringId),
    onSuccess: invalidate,
  });
}

export function useAddMedia() {
  const api = useApiClient();
  const invalidate = useInvalidateMyProvider();
  return useMutation({
    mutationFn: (input: MediaInput) => api.addMedia(input),
    onSuccess: invalidate,
  });
}

export function useDeleteMedia() {
  const api = useApiClient();
  const invalidate = useInvalidateMyProvider();
  return useMutation({
    mutationFn: (mediaId: string) => api.deleteMedia(mediaId),
    onSuccess: invalidate,
  });
}
