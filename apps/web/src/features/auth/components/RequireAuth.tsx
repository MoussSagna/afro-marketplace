import type { UserRole } from '@afro/common';
import { Navigate, Outlet, useLocation } from 'react-router';
import { ForbiddenPage } from '@/app/ForbiddenPage';
import { useSessionStore } from '@/stores/session';

interface RequireAuthProps {
  /** Rôle exigé en plus d'être connecté. */
  role?: Exclude<UserRole, 'client'>;
}

/**
 * Une « garde » de routes : elle se place au-dessus d'un groupe de pages
 * dans le routeur et décide si on peut les voir.
 *
 * - Pas connecté → page de connexion, avec l'adresse demandée dans `?retour=`
 *   pour y revenir juste après.
 * - Connecté sans le rôle prestataire → page « Devenir prestataire ».
 * - Connecté sans le rôle admin → page « Accès refusé ».
 *
 * Attention : c'est du confort d'affichage, pas de la sécurité. Le vrai
 * contrôle des droits se fait côté serveur (ici, dans les handlers MSW).
 */
export function RequireAuth({ role }: RequireAuthProps) {
  const user = useSessionStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    const retour = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/connexion?retour=${retour}`} replace />;
  }
  if (role === 'provider' && !user.roles.includes('provider')) {
    return <Navigate to="/devenir-prestataire" replace />;
  }
  if (role === 'admin' && !user.roles.includes('admin')) {
    return <ForbiddenPage />;
  }
  return <Outlet />;
}
