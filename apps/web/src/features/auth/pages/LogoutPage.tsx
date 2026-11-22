import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useSessionStore } from '@/stores/session';

/**
 * /deconnexion : ferme la session puis renvoie à l'accueil.
 *
 * Pourquoi une page plutôt qu'un simple bouton ? Si l'on fermait la session
 * depuis une page protégée, sa garde verrait la session disparaître et
 * renverrait vers la connexion. Ici, la page protégée est déjà quittée.
 */
export function LogoutPage() {
  const signOut = useSessionStore((state) => state.signOut);
  const user = useSessionStore((state) => state.user);
  const queryClient = useQueryClient();
  // Message éventuel pour l'accueil (ex. : « compte supprimé », C8).
  const { state } = useLocation();

  useEffect(() => {
    signOut();
    // On oublie les données de l'utilisateur précédent (demandes, messages…).
    queryClient.clear();
  }, [signOut, queryClient]);

  return user ? null : <Navigate to="/" replace state={state} />;
}
