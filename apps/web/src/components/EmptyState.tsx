import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Un bouton ou un lien pour sortir de l'état vide (« Trouver un prestataire »). */
  action?: ReactNode;
  className?: string;
}

/** Ce qu'on affiche quand une liste est vide : une icône, un titre, une explication, une action. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-primary">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {description && <p className="max-w-md text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
