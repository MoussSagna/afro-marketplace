import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** La grande carte blanche d'une rubrique (ou d'un bloc dans une rubrique). */
export function AccountCard({
  children,
  className,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-card sm:p-7 lg:rounded-[20px] lg:px-7 lg:py-6',
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Le titre d'un bloc dans une carte (« Mot de passe », « Messages »…), avec son icône. */
export function AccountCardTitle({
  id,
  icon: Icon,
  title,
  description,
}: {
  id: string;
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
        >
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 id={id} className="font-sans text-lg font-semibold">
          {title}
        </h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

/** Les boutons « Annuler » / « Enregistrer » en bas d'un formulaire, et le message qui les précède. */
export function AccountActions({ children, status }: { children: ReactNode; status?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      {status}
      {/* Téléphone : l'un sous l'autre, pleine largeur, l'action principale en premier. */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">{children}</div>
    </div>
  );
}

/** Classes partagées des deux boutons du bas (taille de la maquette : 50 px de haut, pilules). */
export const SECONDARY_ACTION =
  'h-12 rounded-full px-7 text-base font-medium disabled:opacity-60 sm:min-w-31';
export const PRIMARY_ACTION = 'h-12 rounded-full px-7 text-base font-semibold';
