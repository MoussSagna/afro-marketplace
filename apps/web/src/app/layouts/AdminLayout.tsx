import { Flag, LayoutDashboard, UserCheck, Users } from 'lucide-react';
import { Outlet } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { SpaceNav, type SpaceNavItem } from '@/components/layout/SpaceNav';
import { useRememberSpace } from '@/components/layout/useRememberSpace';

const items: SpaceNavItem[] = [
  { to: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
  { to: '/admin/prestataires', label: 'Profils à valider', icon: UserCheck },
  { to: '/admin/signalements', label: 'Signalements', icon: Flag },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
];

/** Gabarit de l'administration : sobre, un menu latéral et des tableaux. */
export function AdminLayout() {
  useRememberSpace('admin');

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar spaceLabel="Admin" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
        <SpaceNav
          items={items}
          label="Administration"
          variant="side"
          className="hidden w-56 shrink-0 md:block"
        />
        <SpaceNav
          items={items}
          label="Administration (mobile)"
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
