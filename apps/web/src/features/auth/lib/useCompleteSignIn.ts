import type { Session } from '@afro/common';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { safeRedirect } from '@/lib/safeRedirect';
import { defaultSpaceFor, SPACE_HOME, useSessionStore } from '@/stores/session';

/**
 * Ce qu'on fait après TOUTE connexion réussie (compte de démo, email + mot de passe, inscription,
 * nouveau mot de passe) : vider le cache, ranger la session, puis aller à la page demandée
 * (`?retour=`, vérifiée par `safeRedirect`) ou, à défaut, à l'accueil de l'espace du compte.
 */
export function useCompleteSignIn() {
  const signIn = useSessionStore((state) => state.signIn);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (session: Session) => {
    // Les données en cache appartenaient peut-être à un autre compte.
    queryClient.clear();
    signIn(session);
    const fallback = SPACE_HOME[defaultSpaceFor(session.user.roles)];
    navigate(safeRedirect(searchParams.get('retour'), fallback), { replace: true });
  };
}

/** Garde le `?retour=` d'une page d'authentification à l'autre (connexion ↔ inscription…). */
export function useAuthLink() {
  const [searchParams] = useSearchParams();
  const retour = searchParams.get('retour');
  return (path: string) => (retour ? `${path}?retour=${encodeURIComponent(retour)}` : path);
}
