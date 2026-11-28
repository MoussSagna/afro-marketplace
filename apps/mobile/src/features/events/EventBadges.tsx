import type { EventProviderStatus, EventStatus } from '@afro/common';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';
import { EVENT_PROVIDER_STATUS_DISPLAY, EVENT_STATUS_BADGE } from './eventDisplay';

/** « En préparation », « Devis en cours », « Passé » (statut calculé par @afro/common). */
export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { t } = useTranslation();
  return <Badge variant={EVENT_STATUS_BADGE[status]}>{t(`events.status.${status}`)}</Badge>;
}

/** Le statut d'un prestataire dans l'événement : icône + texte, jamais la couleur seule. */
export function EventProviderStatusBadge({ status }: { status: EventProviderStatus }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { badge, icon: Icon } = EVENT_PROVIDER_STATUS_DISPLAY[status];
  const color = {
    muted: colors['muted-foreground'],
    warning: colors.warning,
    sun: colors['accent-foreground'],
    success: colors.success,
  }[badge];
  return (
    <Badge variant={badge} icon={<Icon size={12} color={color} strokeWidth={2.4} />}>
      {t(`events.providerStatus.${status}`)}
    </Badge>
  );
}
