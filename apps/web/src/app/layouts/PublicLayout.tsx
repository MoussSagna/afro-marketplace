import { motion } from 'motion/react';
import { Link, Outlet, useLocation } from 'react-router';
import { AppHeader } from '@/components/layout/AppHeader';

const FOOTER_LINKS = [
  { to: '/comment-ca-marche', label: 'Comment ça marche' },
  { to: '/devenir-prestataire', label: 'Devenir prestataire' },
  { to: '/faq', label: 'FAQ' },
  { to: '/cgu', label: 'CGU' },
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/confidentialite', label: 'Confidentialité' },
];

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
      <footer className="border-t py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4">
          <nav aria-label="Liens utiles">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-foreground hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-center">
            Prestataires afro en Île-de-France · Version de développement (données fictives)
          </p>
        </div>
      </footer>
    </div>
  );
}
