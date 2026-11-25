import { useCategories } from '@afro/common';
import { ChevronDown, Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Logo } from '@/components/Logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScrolled } from '@/hooks/useScrolled';
import { cn } from '@/lib/utils';
import { SPACE_HOME, useSessionStore } from '@/stores/session';
import { UserMenu } from './UserMenu';

/** Les liens principaux (« Prestataires » est un menu, inséré en 2ᵉ position). */
const LINKS_BEFORE = [{ to: '/', label: 'Accueil', end: true }];
const LINKS_AFTER = [
  { to: '/evenements', label: 'Événements', end: false },
  { to: '/offres', label: 'Offres & Deals', end: false },
  { to: '/comment-ca-marche', label: 'Notre mission', end: false },
];

const focusRing =
  'outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-foreground';

/**
 * La navbar de l'accueil, posée sur le hero :
 * - au chargement, totalement transparente (texte et logo clairs sur la photo) ;
 * - dès que la page défile, elle reste en haut et prend un fond brun translucide flouté.
 * Sur téléphone et tablette, les liens passent dans un menu latéral.
 */
export function Navbar() {
  const scrolled = useScrolled();
  const user = useSessionStore((state) => state.user);
  const lastSpace = useSessionStore((state) => state.lastSpace);
  const categories = useCategories();
  const mainCategories = categories.data?.filter((category) => !category.parentId) ?? [];
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative rounded-md py-2 text-sm font-medium whitespace-nowrap text-white/90 transition-colors hover:text-white xl:text-[15px] 2xl:text-base',
      'after:absolute after:inset-x-0 after:-bottom-1 after:h-[3px] after:origin-left after:scale-x-0 after:rounded-full after:bg-cta after:transition-transform hover:after:scale-x-100',
      isActive && 'font-semibold text-white after:scale-x-100',
      focusRing,
    );

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        'fixed inset-x-0 top-0 z-40 text-white transition-[background-color,box-shadow,backdrop-filter] duration-300',
        scrolled
          ? 'bg-foreground/75 shadow-pop backdrop-blur-md backdrop-saturate-150'
          : 'bg-transparent',
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 transition-[height] duration-300 sm:px-6 lg:px-8 2xl:px-[4.2vw]',
          scrolled ? 'h-16 lg:h-[72px]' : 'h-[72px] lg:h-[84px]',
        )}
      >
        <Link to="/" aria-label="Wenzee, accueil" className={cn('shrink-0 rounded-md', focusRing)}>
          <Logo variant="light" className="h-10 sm:h-11 lg:h-10 2xl:h-12" />
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-4 xl:gap-7 2xl:gap-9">
            {LINKS_BEFORE.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className={linkClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  className={cn(
                    linkClass({ isActive: false }),
                    'flex items-center gap-1 data-[state=open]:text-white data-[state=open]:after:scale-x-100',
                  )}
                >
                  Prestataires
                  <ChevronDown className="size-4" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={12} className="w-60 rounded-xl p-2">
                  <DropdownMenuItem asChild>
                    <Link to="/recherche" className="font-semibold">
                      Tous les prestataires
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {mainCategories.map((category) => (
                    <DropdownMenuItem key={category.id} asChild>
                      <Link to={`/categories/${category.slug}`}>{category.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
            {LINKS_AFTER.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className={linkClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3 lg:gap-2 xl:gap-3">
          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                to={SPACE_HOME[lastSpace]}
                className={cn('rounded-full px-4 py-2 font-medium hover:bg-white/10', focusRing)}
              >
                Mon espace
              </Link>
              <UserMenu />
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex xl:gap-3">
              <Link
                to="/connexion"
                className={cn(
                  'flex h-10 items-center rounded-full border-[1.5px] border-white/90 px-4 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-white hover:text-foreground xl:h-11 xl:px-5 xl:text-[15px]',
                  focusRing,
                )}
              >
                Se connecter
              </Link>
              <Link
                to="/connexion"
                className={cn(
                  'flex h-10 items-center rounded-full bg-cta px-4 text-sm font-semibold whitespace-nowrap text-cta-foreground transition-colors hover:bg-cta-hover xl:h-11 xl:px-6 xl:text-[15px]',
                  focusRing,
                )}
              >
                S’inscrire
              </Link>
            </div>
          )}

          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogTrigger
              aria-label="Ouvrir le menu"
              className={cn(
                'flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 lg:hidden',
                focusRing,
              )}
            >
              <Menu className="size-7" aria-hidden />
            </DialogTrigger>
            <DialogContent className="top-0 right-0 left-auto flex h-dvh w-[min(22rem,calc(100%-3rem))] max-w-none translate-x-0 translate-y-0 flex-col gap-6 overflow-y-auto rounded-none border-0 bg-background p-6 sm:max-w-none">
              <Logo className="h-9 self-start" />
              <DialogTitle className="sr-only">Menu</DialogTitle>
              <DialogDescription className="sr-only">Les pages du site Wenzee</DialogDescription>
              <MobileMenu
                categories={mainCategories}
                signedIn={!!user}
                spaceHome={SPACE_HOME[lastSpace]}
                onNavigate={() => setMenuOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

interface MobileMenuProps {
  categories: { id: string; slug: string; name: string }[];
  signedIn: boolean;
  spaceHome: string;
  onNavigate: () => void;
}

/** Le contenu du menu latéral (téléphone, tablette) : mêmes liens que la navbar. */
function MobileMenu({ categories, signedIn, spaceHome, onNavigate }: MobileMenuProps) {
  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-12 items-center rounded-md px-3 text-lg font-medium hover:bg-muted',
      isActive && 'bg-muted font-semibold text-primary',
    );
  return (
    <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-6">
      <ul className="flex flex-col gap-1">
        {LINKS_BEFORE.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end={link.end} className={itemClass} onClick={onNavigate}>
              {link.label}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink to="/recherche" className={itemClass} onClick={onNavigate}>
            Prestataires
          </NavLink>
          <ul className="ml-3 flex flex-col border-l pl-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  to={`/categories/${category.slug}`}
                  onClick={onNavigate}
                  className="flex min-h-11 items-center rounded-md px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </li>
        {LINKS_AFTER.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end={link.end} className={itemClass} onClick={onNavigate}>
              {link.label}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink to="/favoris" className={itemClass} onClick={onNavigate}>
            Favoris
          </NavLink>
        </li>
      </ul>
      <div className="mt-auto flex flex-col gap-3">
        {signedIn ? (
          <Link
            to={spaceHome}
            onClick={onNavigate}
            className="flex h-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
          >
            Mon espace
          </Link>
        ) : (
          <>
            <Link
              to="/connexion"
              onClick={onNavigate}
              className="flex h-12 items-center justify-center rounded-full border-2 border-foreground font-semibold"
            >
              Se connecter
            </Link>
            <Link
              to="/connexion"
              onClick={onNavigate}
              className="flex h-12 items-center justify-center rounded-full bg-cta font-semibold text-cta-foreground hover:bg-cta-hover"
            >
              S’inscrire
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
