import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  ForgotPasswordInput,
  ResendOtpInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  UpdateMeInput,
  VerifyOtpInput,
} from '../types';
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

/*
 * Connexion et inscription par email (lot M5). Chaque hook renvoie une mutation :
 * l'application range ensuite la session (store Zustand) et change d'écran.
 */

/** Inscription : crée une inscription en attente, un code est « envoyé ». */
export function useSignUp() {
  const api = useApiClient();
  return useMutation({ mutationFn: (input: SignUpInput) => api.signUp(input) });
}

/** Vérifie le code à 6 chiffres (session pour une inscription, null pour un mot de passe oublié). */
export function useVerifyOtp() {
  const api = useApiClient();
  return useMutation({ mutationFn: (input: VerifyOtpInput) => api.verifyOtp(input) });
}

export function useResendOtp() {
  const api = useApiClient();
  return useMutation({ mutationFn: (input: ResendOtpInput) => api.resendOtp(input) });
}

export function useSignIn() {
  const api = useApiClient();
  return useMutation({ mutationFn: (input: SignInInput) => api.signIn(input) });
}

export function useForgotPassword() {
  const api = useApiClient();
  return useMutation({ mutationFn: (input: ForgotPasswordInput) => api.forgotPassword(input) });
}

export function useResetPassword() {
  const api = useApiClient();
  return useMutation({ mutationFn: (input: ResetPasswordInput) => api.resetPassword(input) });
}
