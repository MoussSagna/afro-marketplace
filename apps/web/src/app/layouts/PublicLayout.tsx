import { motion } from 'motion/react';
import { Outlet, useLocation } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { SiteFooter } from '@/components/layout/SiteFooter';

/**
 * Gabarit des pages publiques : en-tête, contenu, pied de page.
 * La même navbar partout ; sur l'accueil, elle est transparente et posée sur le hero plein écran.
 */
export function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar overlay={pathname === '/'} />
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
