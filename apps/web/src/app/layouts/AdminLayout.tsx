import { Flag, LayoutGrid, Menu, UserCheck, Users } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Logo } from '@/components/Logo';
import { Navbar } from '@/components/layout/Navbar';
import { SpaceNav, type SpaceNavItem } from '@/components/layout/SpaceNav';
import { useRememberSpace } from '@/components/layout/useRememberSpace';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AdminNotifications } from '@/features/admin/components/AdminNotifications';

const items: SpaceNavItem[] = [
  { to: '/admin', label: 'Vue d’ensemble', icon: LayoutGrid, end: true },
  { to: '/admin/prestataires', label: 'Profils à valider', icon: UserCheck },
  { to: '/admin/signalements', label: 'Signalements', icon: Flag },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
];

/**
 * Gabarit du back-office : la navbar en version « application » (logo, badge, notifications,
 * compte), un menu latéral fixe sur ordinateur (dès 1024 px) et, en dessous, un tiroir ouvert
 * par le bouton ☰. Pas de pied de page : c'est un outil de travail, comme la maquette.
 */
export function AdminLayout() {
  useRememberSpace('admin');
  const [drawerOpen, setDrawerOpen] = useState(false);
  // La clé du fondu : la section (`/admin/prestataires/…` → `prestataires`), pas l'adresse complète.
  const section = useLocation().pathname.split('/')[2] ?? '';
  // Un lien choisi dans le tiroir le referme.
  const closeOnLink = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('a')) setDrawerOpen(false);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        appShell
        spaceLabel="Back office admin"
        accountLabel="Admin"
        leading={
          <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DialogTrigger
              aria-label="Ouvrir le menu d’administration"
              className="-ml-1 flex size-11 items-center justify-center rounded-full text-white transition-colors outline-none hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-ring lg:hidden"
            >
              <Menu className="size-6" aria-hidden />
            </DialogTrigger>
            <DialogContent className="top-0 left-0 flex h-dvh w-[min(20rem,calc(100%-3rem))] max-w-none translate-x-0 translate-y-0 flex-col gap-6 overflow-y-auto rounded-none border-0 border-r bg-background p-5 sm:max-w-none">
              <div className="flex flex-col gap-2">
                <Logo className="h-9 self-start" />
                <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  Back office admin
                </span>
              </div>
              <DialogTitle className="sr-only">Menu d’administration</DialogTitle>
              <DialogDescription className="sr-only">
                Les pages du back-office Wenzee
              </DialogDescription>
              <div onClick={closeOnLink}>
                <SpaceNav items={items} label="Administration" variant="sidebar" />
              </div>
            </DialogContent>
          </Dialog>
        }
      >
        <AdminNotifications />
        <span aria-hidden className="mx-1 hidden h-8 w-px bg-white/25 sm:block" />
      </Navbar>
      <div className="flex flex-1">
        <aside className="sticky top-[72px] hidden h-[calc(100dvh-72px)] w-[296px] shrink-0 overflow-y-auto border-r bg-background px-4 pt-11 pb-6 lg:block">
          <SpaceNav items={items} label="Administration" variant="sidebar" />
        </aside>
        {/* Fondu CSS (tw-animate-css), sans déplacement ; coupé par « réduire les animations ». */}
        <main
          key={section}
          className="min-w-0 flex-1 animate-in px-4 pt-6 pb-16 duration-300 fade-in motion-reduce:animate-none sm:px-6 sm:pt-8 lg:pt-10 lg:pr-6 lg:pb-20 lg:pl-10"
        >
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
