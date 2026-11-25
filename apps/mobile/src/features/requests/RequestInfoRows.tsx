import { formatPrice, type QuoteRequest } from '@afro/common';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { longDay } from '@/lib/dates';

/** Le budget d'une demande : « 2 000 € – 3 000 € », un seul montant, ou rien. */
function budgetLabel(request: QuoteRequest, euros: (cents: number) => string) {
  const { budgetMin, budgetMax } = request;
  if (budgetMin !== undefined && budgetMax !== undefined)
    return `${euros(budgetMin)} – ${euros(budgetMax)}`;
  if (budgetMax !== undefined) return euros(budgetMax);
  if (budgetMin !== undefined) return euros(budgetMin);
  return undefined;
}

/**
 * Les informations d'une demande, une par ligne (événement, date, invités, lieu, budget),
 * dans le détail côté client (C3) et côté prestataire (S3). Côté prestataire, on ajoute
 * pour qui l'événement est organisé (`withClientType`).
 */
export function RequestInfoRows({
  request,
  withClientType = false,
}: {
  request: QuoteRequest;
  withClientType?: boolean;
}) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const budget = budgetLabel(request, (cents) => formatPrice(cents, locale));
  const rows = [
    { label: t('requests.event'), value: t(`eventTypes.${request.eventType}`) },
    { label: t('requests.date'), value: longDay(request.eventDate, locale) },
    request.guestCount
      ? { label: t('requests.guests'), value: String(request.guestCount) }
      : undefined,
    { label: t('requests.place'), value: `${request.eventCity} (${request.eventPostalCode})` },
    budget ? { label: t('requests.budget'), value: budget } : undefined,
    withClientType
      ? { label: t('proRequests.organisedBy'), value: t(`clientTypes.${request.clientType}`) }
      : undefined,
  ].filter((row) => row !== undefined);

  return (
    <View>
      {rows.map((row) => (
        <View
          key={row.label}
          className="flex-row justify-between gap-4 border-b border-border py-2.5"
          accessible
          accessibilityLabel={`${row.label} : ${row.value}`}
        >
          <Text size="sm" tone="muted">
            {row.label}
          </Text>
          <Text size="sm" weight="semibold" className="flex-1 text-right">
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
