import {
  EVENT_PROVIDER_STATUS_LABELS,
  EVENT_STATUS_LABELS,
  type EventProviderStatus,
  type EventStatus,
} from '@afro/common';
import { cn } from '@/lib/utils';
import {
  EVENT_PROVIDER_STATUS_DISPLAY,
  EVENT_STATUS_TONES,
  TONE_CLASSES,
} from '../lib/eventDisplay';

const pill =
  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap';

/** « En préparation », « Devis en cours », « Passé ». */
export function EventStatusBadge({
  status,
  className,
}: {
  status: EventStatus;
  className?: string;
}) {
  return (
    <span className={cn(pill, TONE_CLASSES[EVENT_STATUS_TONES[status]], className)}>
      {EVENT_STATUS_LABELS[status]}
    </span>
  );
}

/** « Ajouté », « Devis demandé », « Devis reçu », « Retenu »… avec une icône (pas la couleur seule). */
export function EventProviderStatusBadge({
  status,
  className,
}: {
  status: EventProviderStatus;
  className?: string;
}) {
  const { tone, icon: Icon } = EVENT_PROVIDER_STATUS_DISPLAY[status];
  return (
    <span className={cn(pill, TONE_CLASSES[tone], className)}>
      <Icon className="size-3.5" strokeWidth={2.2} aria-hidden />
      {EVENT_PROVIDER_STATUS_LABELS[status]}
    </span>
  );
}
