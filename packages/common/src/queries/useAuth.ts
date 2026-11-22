import { useMutation, useQuery } from '@tanstack/react-query';
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
