import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupIcon } from '../../lib/searchDraft';
import type { GuidedOption } from './useGuidedSearch';

interface OptionListProps {
  id: string;
  label: string;
  options: GuidedOption[];
  active: number;
  onActiveChange(index: number): void;
  /** `tiles` : grille de tuiles (les univers quand rien n'est tapé) ; `rows` : liste. */
  layout?: 'tiles' | 'rows';
  emptyText?: string;
}

/**
 * Une liste de propositions (rôle ARIA `listbox`) reliée à un champ texte.
 * `onMouseDown` empêche le champ de perdre le focus quand on clique une proposition.
 */
export function OptionList({
  id,
  label,
  options,
  active,
  onActiveChange,
  layout = 'rows',
  emptyText,
}: OptionListProps) {
  if (!options.length) {
    return <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul
      id={id}
      role="listbox"
      aria-label={label}
      className={cn(
        layout === 'tiles' ? 'grid grid-cols-2 gap-2 sm:grid-cols-4' : 'flex flex-col gap-0.5',
      )}
    >
      {options.map((option, index) => {
        const Icon = option.groupSlug ? groupIcon(option.groupSlug) : MapPin;
        const selected = index === active;
        return (
          <li
            key={option.key}
            id={`${id}-${index}`}
            role="option"
            aria-selected={selected}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => onActiveChange(index)}
            onClick={option.pick}
            className={cn(
              'cursor-pointer rounded-2xl transition-colors',
              layout === 'tiles'
                ? 'flex flex-col items-center gap-2 border border-border px-2 py-4 text-center hover:border-foreground/40'
                : 'flex items-center gap-4 px-3 py-2.5',
              selected && (layout === 'tiles' ? 'border-foreground/40 bg-muted' : 'bg-muted'),
            )}
          >
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-xl',
                layout === 'tiles' ? 'size-12 bg-accent/25' : 'size-11 bg-muted',
                selected && layout === 'rows' && 'bg-card',
              )}
            >
              <Icon className="size-6 text-primary" strokeWidth={1.6} aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col">
              <span
                className={cn(
                  'font-semibold',
                  layout === 'tiles' ? 'text-sm leading-tight' : 'truncate text-[15px]',
                )}
              >
                {option.label}
              </span>
              {option.hint && layout === 'rows' && (
                <span className="truncate text-sm text-muted-foreground">{option.hint}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
