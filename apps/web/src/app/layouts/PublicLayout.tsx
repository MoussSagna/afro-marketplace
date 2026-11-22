import { motion } from 'motion/react';
import { Outlet, useLocation } from 'react-router';
import { AppHeader } from '@/components/layout/AppHeader';

/** Gabarit des pages publiques : en-tête, contenu, pied de page. */
export function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
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
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Prestataires afro en Île-de-France · Version de développement (données fictives)
      </footer>
    </div>
  );
}
