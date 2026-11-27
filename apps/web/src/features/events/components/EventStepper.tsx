import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENT_STEPS } from '../lib/eventSteps';

/** Le stepper Type / Informations / Détails : étapes faites (coche verte), en cours, à venir. */
export function EventStepper({ step }: { step: number }) {
  return (
    <ol aria-label="Étapes" className="mb-7 grid grid-cols-3 sm:mb-8">
      {EVENT_STEPS.map(({ label }, index) => {
        const n = index + 1;
        const done = n < step;
        const current = n === step;
        return (
          <li
            key={label}
            aria-current={current ? 'step' : undefined}
            className={cn(
              'relative flex flex-col items-center gap-2 text-[13px] font-medium text-muted-foreground sm:text-sm',
              current && 'font-bold text-foreground',
              // Le trait qui relie les étapes.
              n > 1 &&
                'before:absolute before:top-[15px] before:right-[calc(50%+24px)] before:left-[calc(-50%+24px)] before:h-0.5 before:rounded-full',
              n > 1 && (done || current ? 'before:bg-ochre' : 'before:bg-border'),
            )}
          >
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full border-2 bg-card font-bold',
                done && 'border-success bg-success-muted text-success',
                current && 'border-cta bg-cta text-cta-foreground',
                !done && !current && 'border-border',
              )}
            >
              {done ? <Check className="size-4" strokeWidth={2.6} aria-hidden /> : n}
            </span>
            {label}
            {done && <span className="sr-only"> (terminée)</span>}
          </li>
        );
      })}
    </ol>
  );
}
