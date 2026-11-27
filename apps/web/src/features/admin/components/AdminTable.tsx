import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Un tableau du back-office. Sur ordinateur et tablette (≥ 768 px), un vrai tableau ;
 * sur téléphone, chaque ligne devient une carte : l'en-tête est masqué (gardé pour les lecteurs
 * d'écran) et chaque cellule affiche son intitulé au-dessus de sa valeur (`AdminCell label`).
 * Une seule version dans la page : rien n'est dupliqué, rien ne déborde.
 */
export function AdminTable({
  caption,
  head,
  children,
}: {
  caption: string;
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card shadow-card md:overflow-x-auto">
      <table className="w-full text-left text-sm max-md:block">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b bg-muted/60 text-muted-foreground max-md:sr-only">
          <tr>
            {head.map((label) => (
              <th
                key={label}
                scope="col"
                className="px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap first:pl-6"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y max-md:block">{children}</tbody>
      </table>
    </div>
  );
}

/** Une ligne : rangée de tableau, ou carte sur téléphone. */
export function AdminRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-muted/40 max-md:flex max-md:flex-wrap max-md:gap-x-6 max-md:gap-y-3 max-md:p-4',
        className,
      )}
    >
      {children}
    </tr>
  );
}

/**
 * Une cellule. `label` : l'intitulé affiché au-dessus de la valeur sur téléphone.
 * `primary` : la cellule principale (nom), sur toute la largeur de la carte, sans intitulé.
 */
export function AdminCell({
  label,
  primary,
  className,
  children,
}: {
  label: string;
  primary?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <td
      data-label={label}
      className={cn(
        'px-5 py-4 align-middle first:pl-6 max-md:block max-md:p-0 max-md:first:pl-0',
        primary
          ? 'max-md:w-full'
          : 'max-md:before:mb-0.5 max-md:before:block max-md:before:text-xs max-md:before:text-muted-foreground max-md:before:content-[attr(data-label)]',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'terra';
}) {
  const styles = {
    neutral: 'bg-secondary text-foreground',
    success: 'bg-success-muted text-success',
    warning: 'bg-warning-muted text-warning',
    danger: 'bg-red-50 text-destructive',
    terra: 'bg-title-accent/12 text-primary',
  }[tone];
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
        styles,
      )}
    >
      {children}
    </span>
  );
}

/** Le message après une action réussie (« Profil publié… »), lu par les lecteurs d'écran. */
export function AdminFeedback({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-xl border border-success/20 bg-success-muted px-4 py-3 text-sm font-medium text-success"
    >
      {children}
    </p>
  );
}
