import { Outlet, useLocation } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { SiteFooter } from '@/components/layout/SiteFooter';

/**
 * Gabarit du planificateur d'événements (« Événements » de la navbar) : la navbar du site, sans
 * badge ni onglets d'espace (demande de Mouss, 27/11/2026), la page, le pied de page.
 * Le contenu fait au moins la hauteur de l'écran sous la navbar (64 px, 72 px dès 1024 px) : même une page
 * courte repousse le pied de page sous la ligne de flottaison (demande de Mouss, 27/11/2026).
 * Un léger fondu accompagne le changement de page (coupé par « réduire les animations »).
 */
export function EventsLayout() {
  // La clé du fondu : la page (`/evenements/evt-1/devis` → `evt-1/devis`).
  const page = useLocation().pathname.split('/').slice(2).join('/');

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main
        key={page}
        className="mx-auto min-h-[calc(100dvh-4rem)] w-full lg:min-h-[calc(100dvh-72px)] max-w-[1458px] flex-1 animate-in px-4 pt-6 pb-16 duration-300 fade-in motion-reduce:animate-none sm:pt-8 lg:pb-24"
      >
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
