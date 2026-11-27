import { useCategories } from '@afro/common';
import { ChevronDown, Menu } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, useScroll } from 'motion/react';
import { useCallback, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
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
import {
  CompactSearch,
  ExpandedSearch,
} from '@/features/search/components/guided-search/HeaderSearch';
import { MobileSearch } from '@/features/search/components/guided-search/MobileSearch';
import { useHeroSearchInView, type SearchStep } from '@/features/search/lib/searchDraft';
import { useScrollHeader } from '@/hooks/useScrollHeader';
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

interface NavbarProps {
  /**
   * Accueil seulement : posée sur la photo du hero, transparente tant qu'on n'a pas défilé.
   * Ailleurs (faux) : collée en haut de la page, toujours sur son fond brun.
   */
  overlay?: boolean;
  /**
   * Accueil seulement : la recherche compacte de l'en-tête, quand celle du hero n'est plus visible.
   * (Une page à photo plein écran, comme la fiche prestataire, a `overlay` sans la recherche.)
   */
  withSearch?: boolean;
  /** Petit badge à côté du logo (« Espace pro », « Admin »). */
  spaceLabel?: string;
  /** Actions propres à un espace (bascule client ↔ prestataire…). */
  children?: ReactNode;
  /**
   * Back-office (admin) : barre d'application compacte et toujours visible, sans les liens du site
   * ni leur menu de téléphone (l'espace a son propre menu latéral), sans animation au défilement.
   */
  appShell?: boolean;
  /** Avant le logo (back-office : le bouton qui ouvre le menu latéral sur téléphone et tablette). */
  leading?: ReactNode;
  /** Le nom affiché à côté de l'avatar du menu du compte (par défaut : le prénom, dès 1280 px). */
  accountLabel?: string;
}

/**
 * La navbar de toute l'application (même design partout) :
 * - sur l'accueil et la fiche prestataire (`overlay`), totalement transparente au chargement, puis fond brun translucide flouté au défilement ;
 * - sur les autres pages, collée en haut avec ce même fond brun dès le départ.
 * Sur téléphone et tablette, les liens passent dans un menu latéral.
 *
 * Animations au défilement (toutes les pages) :
 * - la barre se compacte (moins haute, logo plus petit) dès qu'on quitte le haut de la page ;
 * - elle glisse hors de l'écran quand on descend, et revient dès qu'on remonte ;
 * - un fin trait orange, en bas de la barre, montre où l'on en est dans la page.
 * Elle reste toujours visible si un de ses éléments a le focus clavier ou si le menu « Prestataires »
 * est ouvert. Avec « réduire les animations », elle ne se cache jamais et ne glisse pas.
 *
 * Recherche (accueil, comme chez Airbnb) : une fois la recherche du hero sortie de l'écran, les liens
 * laissent la place à une recherche compacte ; un clic la déplie en grand sous la barre.
 * Sur téléphone et tablette, c'est une loupe qui ouvre la recherche plein écran.
 */
export function Navbar({
  overlay = false,
  withSearch = false,
  spaceLabel,
  children,
  appShell = false,
  leading,
  accountLabel,
}: NavbarProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const scrollState = useScrollHeader({ canHide: !reduceMotion && !appShell });
  // Back-office : ni compactage ni disparition au défilement (le menu latéral se cale dessous).
  const scrolled = scrollState.scrolled && !appShell;
  const hidden = scrollState.hidden && !appShell;
  // Progression dans la page, de 0 à 1 : la largeur du trait orange.
  const { scrollYProgress } = useScroll();
  // Fond brun : toujours hors de l'accueil, après le défilement sur l'accueil.
  const solid = !overlay || scrolled;
  const user = useSessionStore((state) => state.user);
  const lastSpace = useSessionStore((state) => state.lastSpace);
  const categories = useCategories();
  const mainCategories = categories.data?.filter((category) => !category.parentId) ?? [];
  const [menuOpen, setMenuOpen] = useState(false);
  const heroSearchInView = useHeroSearchInView((state) => state.inView);
  // La recherche de l'en-tête : seulement sur l'accueil, quand celle du hero n'est plus visible.
  const showSearch = withSearch && !heroSearchInView;
  const [searchStep, setSearchStep] = useState<SearchStep | null>(null);
  const closeSearch = useCallback(() => setSearchStep(null), []);
  const searchOpen = showSearch && searchStep !== null;
  const location = useLocation();
  // Se connecter depuis une page : on y revient ensuite (pas depuis l'accueil : on arrive dans son espace).
  const here = location.pathname + location.search;
  const loginUrl = here === '/' ? '/connexion' : `/connexion?retour=${encodeURIComponent(here)}`;
  const signUpUrl = loginUrl.replace('/connexion', '/inscription');
  // « Prestataires » est souligné sur la recherche, les catégories et les profils.
  const onProviders = /^\/(recherche|categories|prestataires)(\/|$)/.test(location.pathname);
  // « Mon espace » : seulement sur les pages publiques (dans un espace, le menu de l'espace suffit).
  const showSpaceLink = !spaceLabel && !children;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative rounded-md py-2 text-sm font-medium whitespace-nowrap text-white/90 transition-colors hover:text-white xl:text-[15px] 2xl:text-base',
      'after:absolute after:inset-x-0 after:-bottom-1 after:h-[3px] after:origin-left after:scale-x-0 after:rounded-full after:bg-cta after:transition-transform hover:after:scale-x-100',
      isActive && 'font-semibold text-white after:scale-x-100',
      focusRing,
    );

  return (
    <header
      data-scrolled={overlay ? scrolled : undefined}
      data-hidden={hidden}
      data-search-open={searchOpen || undefined}
      className={cn(
        'inset-x-0 top-0 z-40 text-white transition-[background-color,box-shadow,backdrop-filter,translate] duration-300 ease-out motion-reduce:transition-none',
        // Cachée en descendant… sauf si le clavier est dedans ou si le menu « Prestataires » est ouvert.
        hidden &&
          '-translate-y-full focus-within:translate-y-0 has-[[data-state=open]]:translate-y-0',
        overlay ? 'fixed' : 'sticky',
        !solid && 'bg-transparent',
        solid && overlay && 'bg-foreground/75 shadow-pop backdrop-blur-md backdrop-saturate-150',
        // Hors accueil, sur fond clair : presque opaque pour garder le même brun.
        solid && !overlay && 'bg-foreground/95 shadow-pop backdrop-blur-md backdrop-saturate-150',
      )}
    >
      <div
        className={cn(
          'relative mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 transition-[height] duration-300 motion-reduce:transition-none sm:px-6 lg:px-8 2xl:px-[4.2vw]',
          solid ? 'h-16 lg:h-[72px]' : 'h-[72px] lg:h-[84px]',
          appShell && 'max-w-none sm:px-5 lg:pr-8 lg:pl-9 2xl:px-10',
        )}
      >
        <div className="flex shrink-0 items-center gap-2">
          {leading}
          <Link to="/" aria-label="Wenzee, accueil" className={cn('rounded-md', focusRing)}>
            <Logo
              variant="light"
              className={cn(
                'transition-[height] duration-300 motion-reduce:transition-none',
                solid ? 'h-8 sm:h-9 2xl:h-10' : 'h-9 sm:h-10 2xl:h-12',
                appShell && 'h-8 sm:h-10 2xl:h-10',
              )}
            />
          </Link>
          {spaceLabel && (
            <span
              className={cn(
                'hidden rounded-full bg-white/15 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white sm:inline-flex',
                appShell && 'ml-5 px-3.5 py-1.5 text-[15px] font-medium',
              )}
            >
              {spaceLabel}
            </span>
          )}
        </div>

        {/* Recherche compacte : posée au centre, à la place des liens (grand écran). */}
        <AnimatePresence>
          {showSearch && !searchOpen && (
            <motion.div
              key="compact-search"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 6 }}
              transition={{ duration: reduceMotion ? 0 : 0.22 }}
              className="absolute left-1/2 hidden -translate-x-1/2 lg:block"
            >
              <CompactSearch onOpen={setSearchStep} />
            </motion.div>
          )}
        </AnimatePresence>

        {!appShell && (
          <nav
            aria-label="Navigation principale"
            aria-hidden={showSearch || undefined}
            inert={showSearch || undefined}
            className={cn(
              'hidden transition-[opacity,translate] duration-200 lg:block',
              showSearch && 'pointer-events-none -translate-y-2 opacity-0',
            )}
          >
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
                      linkClass({ isActive: onProviders }),
                      'flex items-center gap-1 data-[state=open]:text-white data-[state=open]:after:scale-x-100',
                    )}
                  >
                    Prestataires
                    <ChevronDown className="size-4" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={12}
                    className="w-60 rounded-xl p-2"
                  >
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
        )}

        <div className="flex items-center gap-1 sm:gap-3 lg:gap-2 xl:gap-3">
          {showSearch && <MobileSearch trigger="icon" className="lg:hidden" />}
          {children}
          {user ? (
            <div className="flex items-center gap-2">
              {showSpaceLink && (
                <Link
                  to={SPACE_HOME[lastSpace]}
                  className={cn(
                    'hidden rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap hover:bg-white/10 lg:block xl:text-[15px]',
                    focusRing,
                  )}
                >
                  Mon espace
                </Link>
              )}
              {/* Le menu du compte reste visible sur téléphone (pour se déconnecter, changer d'espace). */}
              <UserMenu label={accountLabel} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex xl:gap-3">
              <Link
                to={loginUrl}
                className={cn(
                  'flex h-10 items-center rounded-full border-[1.5px] border-white/90 px-4 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-white hover:text-foreground xl:h-11 xl:px-5 xl:text-[15px]',
                  focusRing,
                )}
              >
                Se connecter
              </Link>
              <Link
                to={signUpUrl}
                className={cn(
                  'flex h-10 items-center rounded-full bg-cta px-4 text-sm font-semibold whitespace-nowrap text-cta-foreground transition-colors hover:bg-cta-hover xl:h-11 xl:px-6 xl:text-[15px]',
                  focusRing,
                )}
              >
                S’inscrire
              </Link>
            </div>
          )}

          {!appShell && (
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
                  loginUrl={loginUrl}
                  signUpUrl={signUpUrl}
                  onNavigate={() => setMenuOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      {showSearch && <ExpandedSearch step={searchStep} onClose={closeSearch} />}
      {/* Fil de lecture : visible seulement une fois la barre sur son fond brun. */}
      <motion.div
        aria-hidden
        data-testid="scroll-progress"
        className={cn(
          'absolute inset-x-0 bottom-0 h-[3px] origin-left bg-cta transition-opacity duration-300',
          solid ? 'opacity-100' : 'opacity-0',
          appShell && 'hidden',
        )}
        style={{ scaleX: scrollYProgress }}
      />
    </header>
  );
}

interface MobileMenuProps {
  categories: { id: string; slug: string; name: string }[];
  signedIn: boolean;
  spaceHome: string;
  loginUrl: string;
  signUpUrl: string;
  onNavigate: () => void;
}

/** Le contenu du menu latéral (téléphone, tablette) : mêmes liens que la navbar. */
function MobileMenu({
  categories,
  signedIn,
  spaceHome,
  loginUrl,
  signUpUrl,
  onNavigate,
}: MobileMenuProps) {
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
              to={loginUrl}
              onClick={onNavigate}
              className="flex h-12 items-center justify-center rounded-full border-2 border-foreground font-semibold"
            >
              Se connecter
            </Link>
            <Link
              to={signUpUrl}
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
