import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router';
import { Toaster } from '@/components/Toaster';

/**
 * La route racine : affiche la page, et remet le défilement en haut quand on change de page.
 *
 * - Nouveau **chemin** (clic sur un lien, redirection après connexion…) : la page s'ouvre en haut.
 *   Changer seulement un filtre (`?onglet=`, `?page=`…) garde la position.
 * - « Retour » / « suivant » (navigation POP) : rien à faire, le navigateur restaure la position.
 * - Premier chargement : rien non plus. (Le `ScrollRestoration` de React Router remontait la page
 *   ~400 ms après le chargement : si on avait déjà défilé, on était ramené en haut.)
 */
export function RootRoute() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return (
    <>
      <Outlet />
      {/* Les toasts (« Événement supprimé… Annuler ») : une seule zone pour toute l'application. */}
      <Toaster />
    </>
  );
}
