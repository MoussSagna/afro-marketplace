import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipGroupProps {
  /** Le nom du groupe, lu par les lecteurs d'écran. */
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  invalid?: boolean;
}

/**
 * Des cases à cocher en forme de pastilles (catégories, origines, langues).
 * Ce sont de vraies cases à cocher, masquées : clavier et lecteurs d'écran fonctionnent.
 */
export function ChipGroup({ label, options, value, onChange, max, invalid }: ChipGroupProps) {
  const full = max !== undefined && value.length >= max;
  return (
    <div
      role="group"
      aria-label={label}
      aria-invalid={invalid || undefined}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const checked = value.includes(option.value);
        const disabled = !checked && full;
        return (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
              checked
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card hover:bg-secondary',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={() =>
                onChange(
                  checked ? value.filter((v) => v !== option.value) : [...value, option.value],
                )
              }
            />
            {checked && <Check className="size-3.5" aria-hidden />}
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
