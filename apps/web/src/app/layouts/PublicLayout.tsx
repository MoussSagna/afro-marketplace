import { motion } from 'motion/react';
import { Outlet, useLocation } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { useNavbarOverlayStore } from '@/stores/navbarOverlay';
import { SiteFooter } from '@/components/layout/SiteFooter';

/**
 * Gabarit des pages publiques : en-tête, contenu, pied de page.
 * La même navbar partout ; sur l'accueil (et sur la couverture d'une fiche prestataire), elle est
 * transparente et posée sur la photo plein écran.
 */
export function PublicLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  // Une page à photo plein écran (fiche prestataire) demande aussi la navbar transparente.
  const pageOverlay = useNavbarOverlayStore((state) => state.requests > 0);
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar overlay={isHome || pageOverlay} withSearch={isHome} />
      {/* Transition douce entre deux pages (désactivée si « réduire les animations »). */}
      <motion.main
        key={pathname}
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <Outlet />
      </motion.main>
      <SiteFooter />
    </div>
  );
}
