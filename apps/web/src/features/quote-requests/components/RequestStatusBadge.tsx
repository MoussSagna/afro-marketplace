import type { QuoteRequest, Side } from '@afro/common';
import { AlarmClock, CircleCheck, CircleX, Clock, FileCheck, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestStatusDisplay, type StatusTone } from '../lib/requestStatus';

const TONE_CLASSES: Record<StatusTone, string> = {
  warning: 'bg-warning-muted text-warning',
  neutral: 'bg-muted text-muted-foreground',
  brand: 'bg-muted text-primary',
  success: 'bg-success-muted text-success',
  closed: 'bg-secondary text-muted-foreground',
};

/** Une icône par couleur : le statut se lit aussi sans la couleur (daltonisme). */
const TONE_ICONS: Record<StatusTone, LucideIcon> = {
  warning: AlarmClock,
  neutral: Clock,
  brand: FileCheck,
  success: CircleCheck,
  closed: CircleX,
};

/**
 * La pastille de statut d'une demande (« Devis reçu », « Réservée »…).
 * `size="lg"` : la grande pastille à icône des cartes du tableau de bord client.
 */
export function RequestStatusBadge({
  request,
  side,
  size = 'sm',
  className,
}: {
  request: Pick<QuoteRequest, 'status' | 'expiresAt'>;
  side: Side;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const { label, tone } = requestStatusDisplay(request, side);
  const Icon = TONE_ICONS[tone];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full font-semibold',
        size === 'sm'
          ? 'px-2.5 py-0.5 text-xs'
          : 'h-8 gap-1.5 px-3 text-[13px] sm:h-10 sm:gap-2 sm:px-4 sm:text-base',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {size === 'lg' && <Icon className="size-4 sm:size-5" aria-hidden />}
      {label}
    </span>
  );
}
