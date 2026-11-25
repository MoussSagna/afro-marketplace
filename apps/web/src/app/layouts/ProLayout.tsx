import { CalendarDays, FileText, LayoutDashboard, MessageCircle, Star, Store } from 'lucide-react';
import { useUnreadCount } from '@afro/common';
import { Link, Outlet } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { SpaceNav, type SpaceNavItem } from '@/components/layout/SpaceNav';
import { useRememberSpace } from '@/components/layout/useRememberSpace';
import { Button } from '@/components/ui/button';

const baseItems: SpaceNavItem[] = [
  { to: '/pro', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/pro/demandes', label: 'Demandes reçues', icon: FileText },
  { to: '/pro/messages', label: 'Messages', icon: MessageCircle },
  { to: '/pro/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/pro/avis', label: 'Avis', icon: Star },
  { to: '/pro/profil', label: 'Mon profil', icon: Store },
];

/**
 * Gabarit de l'espace prestataire : menu latéral sur grand écran,
 * onglets défilants en haut sur téléphone.
 */
export function ProLayout() {
  useRememberSpace('provider');
  // Pastille « non lus » sur « Messages », rafraîchie avec la messagerie.
  const unread = useUnreadCount('provider');
  const items = baseItems.map((item) =>
    item.to.endsWith('/messages') ? { ...item, badge: unread } : item,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar spaceLabel="Espace pro">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-white/50 bg-white/10 text-white hover:bg-white hover:text-foreground"
        >
          <Link to="/espace/demandes" aria-label="Passer en mode client">
            {/* Texte court jusqu'à 1280 px pour que la navbar tienne sur une ligne. */}
            <span className="xl:hidden">Mode client</span>
            <span className="hidden xl:inline">Passer en mode client</span>
          </Link>
        </Button>
      </Navbar>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
        <SpaceNav
          items={items}
          label="Espace prestataire"
          variant="side"
          tone="dark"
          className="hidden w-56 shrink-0 md:block"
        />
        <SpaceNav
          items={items}
          label="Espace prestataire (mobile)"
          variant="top"
          className="border-b md:hidden"
        />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
