import { LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';
import {
  ACCOUNT_SECTIONS,
  accountSectionHref,
  type AccountSectionId,
} from '../lib/accountSections';

const ITEM =
  'flex shrink-0 items-center gap-3 rounded-xl text-[15px] font-medium whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring lg:min-h-14 lg:gap-4 lg:px-5 lg:text-[17px]';
/** Téléphone et tablette : pastilles d'une rangée qui défile ; ordinateur : lignes du menu. */
const ITEM_COMPACT = 'h-11 border px-4 lg:h-auto lg:border-0';

/**
 * Le menu de « Mon compte » : une colonne à gauche sur ordinateur, une rangée de pastilles
 * qui défile sous 1024 px. Les rubriques sont des liens (`?rubrique=`), pas des ancres.
 * « Déconnexion » demande une confirmation puis passe par `/deconnexion`, comme le menu du compte.
 */
export function AccountNavigation({ active }: { active: AccountSectionId }) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  // Pastilles défilantes (sous 1024 px) : la rubrique active est ramenée dans l'écran.
  // On règle `scrollLeft` de la rangée seulement (scrollIntoView ferait aussi défiler la page).
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    const left = item.offsetLeft - list.offsetLeft;
    const right = left + item.offsetWidth;
    if (left < list.scrollLeft || right > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = left - 16;
    }
  }, [active]);

  return (
    <nav
      aria-label="Rubriques du compte"
      className="-mx-4 lg:mx-0 lg:self-start lg:rounded-2xl lg:border lg:bg-card lg:p-4 lg:shadow-card"
    >
      <ul
        ref={listRef}
        className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {ACCOUNT_SECTIONS.map(({ id, label, icon: Icon }) => {
          const current = id === active;
          return (
            <li key={id} className="shrink-0">
              <Link
                to={accountSectionHref(id)}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  ITEM,
                  ITEM_COMPACT,
                  current
                    ? 'border-transparent bg-title-accent/12 font-semibold text-primary'
                    : 'border-border bg-card text-foreground hover:bg-muted lg:bg-transparent',
                )}
              >
                <Icon className="size-5 shrink-0 lg:size-6" strokeWidth={1.8} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className={cn(
              ITEM,
              ITEM_COMPACT,
              'w-full border-border bg-card text-foreground hover:bg-muted lg:bg-transparent',
            )}
          >
            <LogOut className="size-5 shrink-0 lg:size-6" strokeWidth={1.8} aria-hidden />
            Déconnexion
          </button>
        </li>
      </ul>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={LogOut}
        title="Se déconnecter ?"
        description="Vous devrez vous reconnecter pour retrouver vos demandes et vos messages."
        confirmLabel="Se déconnecter"
        onConfirm={() => {
          setConfirmOpen(false);
          void navigate('/deconnexion');
        }}
      />
    </nav>
  );
}
