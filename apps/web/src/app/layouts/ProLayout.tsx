import { CalendarDays, FileText, LayoutDashboard, MessageCircle, Star, Store } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { SpaceNav, type SpaceNavItem } from '@/components/layout/SpaceNav';
import { useRememberSpace } from '@/components/layout/useRememberSpace';
import { Button } from '@/components/ui/button';

const items: SpaceNavItem[] = [
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

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader spaceLabel="Espace pro">
        <Button asChild variant="outline" size="sm">
          <Link to="/espace/demandes">Passer en mode client</Link>
        </Button>
      </AppHeader>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
        <SpaceNav
          items={items}
          label="Espace prestataire"
          variant="side"
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
