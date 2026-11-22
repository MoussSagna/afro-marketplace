import { useMutation, useQuery } from '@tanstack/react-query';
import type { UpdateMeInput } from '../types';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

/** Les comptes proposés sur la page de connexion de démo. */
export function useDemoAccounts() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.auth.demoAccounts,
    queryFn: () => api.listDemoAccounts(),
    staleTime: Infinity,
  });
}

/**
 * Se connecter avec un compte de démo. La session renvoyée est à ranger
 * côté application (le web la garde dans un store Zustand).
 */
export function useSignInAsDemo() {
  const api = useApiClient();
  return useMutation({ mutationFn: (userId: string) => api.signInAsDemo(userId) });
}

/** C8 : modifier son compte. Le web met ensuite la session à jour avec la réponse. */
export function useUpdateMe() {
  const api = useApiClient();
  return useMutation({ mutationFn: (input: UpdateMeInput) => api.updateMe(input) });
}

/** C8 : supprimer son compte (anonymisation RGPD). Le web ferme ensuite la session. */
export function useDeleteMe() {
  const api = useApiClient();
  return useMutation({ mutationFn: () => api.deleteMe() });
}
