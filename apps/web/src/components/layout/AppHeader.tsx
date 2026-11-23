import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SPACE_HOME, useSessionStore } from '@/stores/session';
import { UserMenu } from './UserMenu';

interface AppHeaderProps {
  /** Petit badge à côté du logo (« Espace pro », « Admin »). */
  spaceLabel?: string;
  /** Liens supplémentaires (bascule client ↔ prestataire…). */
  children?: ReactNode;
}

/** L'en-tête commun aux 4 gabarits : logo, liens, compte. */
export function AppHeader({ spaceLabel, children }: AppHeaderProps) {
  const user = useSessionStore((state) => state.user);
  const lastSpace = useSessionStore((state) => state.lastSpace);
  const location = useLocation();
  // Depuis l'accueil, pas d'adresse de retour : on arrivera dans son espace.
  const here = location.pathname + location.search;
  const loginUrl = here === '/' ? '/connexion' : `/connexion?retour=${encodeURIComponent(here)}`;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          <Link to="/" aria-label="Wenzee, accueil" className="flex items-center rounded-md">
            <Logo className="h-8 sm:h-9" />
          </Link>
          {spaceLabel && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {spaceLabel}
            </Badge>
          )}
        </div>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Compte">
          {children}
          {user ? (
            <>
              {/* Sur les pages publiques, un raccourci vers le dernier espace utilisé. */}
              {!children && !spaceLabel && (
                <Button asChild variant="ghost" size="sm">
                  <Link to={SPACE_HOME[lastSpace]}>Mon espace</Link>
                </Button>
              )}
              <UserMenu />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/devenir-prestataire">Devenir prestataire</Link>
              </Button>
              <Button asChild size="sm">
                <Link to={loginUrl}>Connexion</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
