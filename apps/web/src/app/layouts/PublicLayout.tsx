import { Outlet } from 'react-router';
import { AppHeader } from '@/components/layout/AppHeader';

/** Gabarit des pages publiques : en-tête, contenu, pied de page. */
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Prestataires afro en Île-de-France · Version de développement (données fictives)
      </footer>
    </div>
  );
}
