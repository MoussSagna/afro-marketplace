import { Link, Outlet } from 'react-router';
import { Button } from '@/components/ui/button';

/** Gabarit des pages publiques : en-tête, contenu, pied de page. */
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Nom provisoire : la marque n'est pas encore choisie. */}
          <Link to="/" className="font-display text-xl font-semibold text-brand-700">
            Afro Marketplace
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Devenir prestataire
            </Button>
            <Button size="sm">Connexion</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Prestataires afro en Île-de-France · Version de développement (données fictives)
      </footer>
    </div>
  );
}
