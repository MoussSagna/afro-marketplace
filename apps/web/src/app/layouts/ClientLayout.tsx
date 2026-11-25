import { CalendarCheck, FileText, MessageCircle, UserRound } from 'lucide-react';
import { useUnreadCount } from '@afro/common';
import { Link, Outlet } from 'react-router';
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

/** Gabarit de l'espace client : en-tête + onglets en haut de page. */
export function ClientLayout() {
  useRememberSpace('client');
  // Pastille « non lus » sur « Messages », rafraîchie avec la messagerie.
  const unread = useUnreadCount('client');
  const items = baseItems.map((item) =>
    item.to.endsWith('/messages') ? { ...item, badge: unread } : item,
  );
  const isProvider = useSessionStore((state) => state.user?.roles.includes('provider'));

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
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <SpaceNav items={items} label="Espace client" variant="top" className="mb-6 border-b" />
        <main>
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
