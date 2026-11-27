import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AuthInputProps extends React.ComponentProps<'input'> {
  /** L'icône posée à gauche dans le champ (décorative). */
  icon: LucideIcon;
}

const FIELD = 'h-14 rounded-xl border-border bg-card pl-[52px] text-base md:text-base';

/** Un champ des pages de connexion : grand, arrondi, avec une icône à gauche. */
export function AuthInput({ icon: Icon, className, ...props }: AuthInputProps) {
  return (
    <div className="relative">
      <Icon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-[22px] -translate-y-1/2 text-foreground/80"
        strokeWidth={1.8}
      />
      <Input className={cn(FIELD, className)} {...props} />
    </div>
  );
}

/**
 * Le champ mot de passe, avec un bouton œil pour l'afficher ou le masquer.
 * Bouton bascule à libellé fixe (`aria-pressed`) : le lecteur d'écran annonce « Afficher le mot de passe,
 * activé / désactivé ».
 */
export function PasswordInput({ icon: Icon, className, ...props }: AuthInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Icon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-[22px] -translate-y-1/2 text-foreground/80"
        strokeWidth={1.8}
      />
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn(FIELD, 'pr-14', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-pressed={visible}
        aria-label="Afficher le mot de passe"
        className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-foreground/80 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        {visible ? (
          <Eye className="size-[22px]" aria-hidden />
        ) : (
          <EyeOff className="size-[22px]" aria-hidden />
        )}
      </button>
    </div>
  );
}
