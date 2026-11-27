import type * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<React.ComponentProps<'button'>, 'onChange'> {
  checked: boolean;
  onCheckedChange(checked: boolean): void;
}

/**
 * Un interrupteur (rôle ARIA « switch ») : un bouton qui dit « activé / désactivé ».
 * Écrit à la main plutôt qu'avec Radix : quelques lignes suffisent, sans nouvelle dépendance.
 * Espace et Entrée le basculent (comportement natif d'un bouton). Le libellé se passe
 * en `aria-label` ou via un `<label htmlFor>`.
 */
function Switch({ checked, onCheckedChange, className, disabled, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      data-slot="switch"
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none block size-6 rounded-full bg-card shadow-sm transition-transform duration-200 motion-reduce:transition-none',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export { Switch };
