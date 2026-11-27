import type { LucideIcon } from 'lucide-react';
import { useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { useLabelsFit } from './useLabelsFit';

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
  /**
   * « side » : menu latéral sur grand écran ; « top » : onglets horizontaux compacts ;
   * « tabs » : grands onglets de l'espace client (fond terre cuite léger sur l'onglet actif) ;
   * « sidebar » : le grand menu latéral du back-office admin (et son tiroir sur téléphone).
   */
  variant: 'side' | 'top' | 'tabs' | 'sidebar';
  /** « dark » : le menu brun de l'espace pro (maquette). */
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * Le menu d'un espace. NavLink sait si son lien est la page actuelle :
 * on s'en sert pour le style et pour aria-current (lu par les lecteurs d'écran).
 */
export function SpaceNav({ items, label, variant, tone = 'light', className }: SpaceNavProps) {
  const dark = tone === 'dark';
  const listRef = useRef<HTMLUListElement>(null);
  const { pathname } = useLocation();
  // Onglets « tabs » sur téléphone : si un libellé passait sur 2 lignes, tous passent en icônes seules
  // (choix de Mouss, 27/11/2026). Les libellés restent lus par les lecteurs d'écran.
  const labelsFit = useLabelsFit(listRef, {
    enabled: variant === 'tabs',
    maxWidthQuery: '(max-width: 639.98px)',
    deps: `${pathname}|${items.map((item) => item.badge ?? 0).join(',')}`,
  });
  const iconsOnly = variant === 'tabs' && !labelsFit;
  return (
    <nav
      aria-label={label}
      className={cn(
        dark && 'self-start rounded-xl bg-sidebar p-2 text-sidebar-foreground',
        className,
      )}
    >
      <ul
        ref={listRef}
        data-icons-only={iconsOnly || undefined}
        className={cn(
          variant === 'side' && 'flex flex-col gap-1',
          variant === 'sidebar' && 'flex flex-col gap-1.5',
          variant === 'top' && 'flex gap-1 overflow-x-auto pb-1',
          // Téléphone : 4 colonnes égales (icône au-dessus du libellé), rien ne dépasse de l'écran.
          // Dès 640 px : une rangée, plus serrée en tablette.
          variant === 'tabs' && 'grid grid-cols-4 gap-1 pt-1 pb-3 sm:flex sm:gap-1 lg:gap-4',
        )}
      >
        {items.map(({ to, label: itemLabel, icon: Icon, end, badge }) => (
          <li key={to} className={cn('shrink-0', variant === 'tabs' && 'min-w-0')}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                variant === 'sidebar'
                  ? cn(
                      'flex min-h-14 items-center gap-4 rounded-xl px-5 text-[17px] font-medium transition-colors duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring lg:text-[19px]',
                      // Actif : fond terre cuite très léger, texte terre (maquette du back-office).
                      isActive
                        ? 'bg-title-accent/12 font-semibold text-primary'
                        : 'text-foreground hover:bg-muted',
                    )
                  : variant === 'tabs'
                    ? cn(
                        'relative flex h-full min-h-14 flex-col items-center justify-start gap-1 rounded-xl px-1 py-2 sm:justify-center text-center text-[13px] leading-tight font-medium transition-colors duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring sm:h-12 sm:min-h-0 sm:flex-row sm:gap-2.5 sm:px-4 sm:py-0 sm:text-base sm:whitespace-nowrap lg:gap-3 lg:px-6 lg:text-[17px]',
                        // Icônes seules (libellés trop longs) : onglet plus bas, icône centrée.
                        iconsOnly && 'min-h-12 justify-center',
                        isActive
                          ? 'bg-secondary font-semibold text-primary shadow-card'
                          : 'text-foreground hover:bg-muted',
                      )
                    : cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        dark
                          ? isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-white/10'
                          : isActive
                            ? 'bg-muted text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
              }
            >
              <Icon
                className={cn(
                  variant === 'tabs' ? (iconsOnly ? 'size-6' : 'size-5') : 'size-4',
                  variant === 'sidebar' && 'size-7 shrink-0 text-primary',
                )}
                strokeWidth={variant === 'sidebar' ? 1.7 : undefined}
                aria-hidden
              />
              <span data-label className={cn(iconsOnly && 'sr-only')}>
                {itemLabel}
              </span>
              {!!badge && (
                <span
                  className={cn(
                    'relative ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground',
                    variant === 'tabs' &&
                      // Téléphone : pastille posée en haut à droite de l'icône ; sinon après le libellé.
                      'absolute top-1 left-[calc(50%+4px)] ml-0 h-5 min-w-5 bg-cta text-cta-foreground sm:static sm:h-6 sm:min-w-6 sm:text-sm',
                  )}
                >
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
