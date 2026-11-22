import { CalendarCheck, FileText, MessageCircle, UserRound } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { SpaceNav, type SpaceNavItem } from '@/components/layout/SpaceNav';
import { useRememberSpace } from '@/components/layout/useRememberSpace';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/session';

const items: SpaceNavItem[] = [
  { to: '/espace/demandes', label: 'Mes demandes', icon: FileText },
  { to: '/espace/reservations', label: 'Réservations', icon: CalendarCheck },
  { to: '/espace/messages', label: 'Messages', icon: MessageCircle },
  { to: '/espace/compte', label: 'Mon compte', icon: UserRound },
];

/** Gabarit de l'espace client : en-tête + onglets en haut de page. */
export function ClientLayout() {
  useRememberSpace('client');
  const isProvider = useSessionStore((state) => state.user?.roles.includes('provider'));

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader spaceLabel="Espace client">
        {isProvider && (
          <Button asChild variant="outline" size="sm">
            <Link to="/pro">Passer en mode prestataire</Link>
          </Button>
        )}
      </AppHeader>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <SpaceNav items={items} label="Espace client" variant="top" className="mb-6 border-b" />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
