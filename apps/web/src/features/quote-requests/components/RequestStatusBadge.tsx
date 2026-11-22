import type { QuoteRequest, Side } from '@afro/common';
import { cn } from '@/lib/utils';
import { requestStatusDisplay, type StatusTone } from '../lib/requestStatus';

const TONE_CLASSES: Record<StatusTone, string> = {
  warning: 'bg-warning-muted text-warning',
  neutral: 'bg-muted text-muted-foreground',
  brand: 'bg-muted text-primary',
  success: 'bg-success-muted text-success',
  closed: 'bg-secondary text-muted-foreground',
};

/** La pastille de statut d'une demande (« Devis reçu », « Réservée »…). */
export function RequestStatusBadge({
  request,
  side,
  className,
}: {
  request: Pick<QuoteRequest, 'status' | 'expiresAt'>;
  side: Side;
  className?: string;
}) {
  const { label, tone } = requestStatusDisplay(request, side);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
