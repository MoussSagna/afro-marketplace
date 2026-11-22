import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';

export interface SpaceNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** true : actif seulement sur l'adresse exacte (utile pour « Tableau de bord » sur /pro). */
  end?: boolean;
  /** Une pastille (nombre de messages non lus, par exemple). Masquée à 0. */
  badge?: number;
}

interface SpaceNavProps {
  items: SpaceNavItem[];
  label: string;
  /** « side » : menu latéral sur grand écran ; « top » : onglets horizontaux. */
  variant: 'side' | 'top';
  className?: string;
}

/**
 * Le menu d'un espace. NavLink sait si son lien est la page actuelle :
 * on s'en sert pour le style et pour aria-current (lu par les lecteurs d'écran).
 */
export function SpaceNav({ items, label, variant, className }: SpaceNavProps) {
  return (
    <nav aria-label={label} className={className}>
      <ul
        className={cn(
          variant === 'side' ? 'flex flex-col gap-1' : 'flex gap-1 overflow-x-auto pb-1',
        )}
      >
        {items.map(({ to, label: itemLabel, icon: Icon, end, badge }) => (
          <li key={to} className="shrink-0">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-muted text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {itemLabel}
              {!!badge && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                  {badge}
                  <span className="sr-only"> non lu{badge > 1 ? 's' : ''}</span>
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
