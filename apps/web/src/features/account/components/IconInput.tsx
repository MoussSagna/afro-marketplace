import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface IconInputProps extends React.ComponentProps<'input'> {
  /** L'icône posée à gauche dans le champ (décorative). */
  icon: LucideIcon;
}

/** Un champ de « Mon compte » : 44 px de haut, arrondi, avec une icône à gauche (maquette). */
export function IconInput({ icon: Icon, className, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <Icon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-foreground/75"
        strokeWidth={1.8}
      />
      <Input
        className={cn(
          'h-11 rounded-[10px] border-border bg-card pl-12 text-base md:text-base read-only:bg-muted/40',
          className,
        )}
        {...props}
      />
    </div>
  );
}

/** L'astérisque des champs obligatoires (le champ porte aussi `aria-required`). */
export function RequiredMark() {
  return (
    <span aria-hidden className="text-destructive">
      *
    </span>
  );
}
