import { passwordRules } from '@afro/common';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Les règles du mot de passe (8 caractères, une majuscule et un chiffre), cochées en direct. */
export function PasswordRules({ value, id }: { value: string; id?: string }) {
  return (
    <ul
      id={id}
      aria-label="Règles du mot de passe"
      className="flex flex-wrap gap-x-5 gap-y-1 text-sm"
    >
      {passwordRules.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-1.5',
              ok ? 'text-success' : 'text-muted-foreground',
            )}
          >
            {ok ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Circle className="size-3.5" aria-hidden />
            )}
            {rule.label}
            <span className="sr-only">{ok ? ' : oui' : ' : pas encore'}</span>
          </li>
        );
      })}
    </ul>
  );
}
