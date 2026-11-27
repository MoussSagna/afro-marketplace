import { CalendarCheck, FileText, MessageCircle, UserRound } from 'lucide-react';
import { useUnreadCount } from '@afro/common';
import { Link, Outlet, useLocation } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SpaceNav, type SpaceNavItem } from '@/components/layout/SpaceNav';
import { useRememberSpace } from '@/components/layout/useRememberSpace';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/session';

const baseItems: SpaceNavItem[] = [
  { to: '/espace/demandes', label: 'Mes demandes', icon: FileText },
  { to: '/espace/reservations', label: 'Réservations', icon: CalendarCheck },
  { to: '/espace/messages', label: 'Messages', icon: MessageCircle },
  { to: '/espace/compte', label: 'Mon compte', icon: UserRound },
];

/**
 * Gabarit de l'espace client : navbar, grands onglets (Mes demandes, Réservations, Messages,
 * Mon compte), puis la page, dans un conteneur large (1426 px max., comme la maquette du tableau de bord).
 * Un léger fondu accompagne le changement d'onglet (désactivé si « réduire les animations »).
 */
export function ClientLayout() {
  useRememberSpace('client');
  // Pastille « non lus » sur « Messages », rafraîchie avec la messagerie.
  const unread = useUnreadCount('client');
  const items = baseItems.map((item) =>
    item.to.endsWith('/messages') ? { ...item, badge: unread } : item,
  );
  const isProvider = useSessionStore((state) => state.user?.roles.includes('provider'));
  // La clé du fondu : la section (`/espace/messages/conv-1` → `messages`), pas l'adresse complète,
  // pour ne pas rejouer l'animation en ouvrant une conversation ou un filtre.
  const section = useLocation().pathname.split('/')[2] ?? '';

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar spaceLabel="Espace client">
        {isProvider && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-white/50 bg-white/10 text-white hover:bg-white hover:text-foreground"
          >
            <Link to="/pro" aria-label="Passer en mode prestataire">
              {/* Texte court jusqu'à 1280 px pour que la navbar tienne sur une ligne. */}
              <span className="xl:hidden">Mode pro</span>
              <span className="hidden xl:inline">Passer en mode prestataire</span>
            </Link>
          </Button>
        )}
      </Navbar>
      <div className="mx-auto w-full max-w-[1458px] flex-1 px-4 pt-5 pb-16 sm:pt-6 lg:pb-24">
        <SpaceNav
          items={items}
          label="Espace client"
          variant="tabs"
          className="mb-6 border-b sm:px-6 lg:mb-7 lg:px-10"
        />
        {/* Fondu CSS (tw-animate-css), sans déplacement : rien ne bouge sous le doigt ; coupé par « réduire les animations ». */}
        <main key={section} className="animate-in duration-300 fade-in motion-reduce:animate-none">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
