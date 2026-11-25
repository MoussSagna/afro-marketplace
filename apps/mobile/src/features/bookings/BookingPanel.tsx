import {
  cancelBookingInputSchema,
  computeCancellationRefund,
  formatPrice,
  toIsoDate,
  useCancelBooking,
  type Booking,
  type Side,
} from '@afro/common';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Badge, Button, Card, Heading, Input, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { bookingStatus, canCancelBooking } from './bookingStatus';

/**
 * « Ma réservation », dans le détail d'une demande acceptée (C5) : l'adresse (révélée
 * maintenant), les montants, la politique d'annulation, puis « Annuler la réservation »
 * avec, AVANT de confirmer, ce que prévoit la politique (règle n° 9).
 */
export function BookingPanel({ booking, side = 'client' }: { booking: Booking; side?: Side }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const status = bookingStatus(booking);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const euros = (cents: number) => formatPrice(cents, locale);
  const rows = [
    { label: t('bookings.address'), value: booking.eventAddress },
    { label: t('bookings.total'), value: euros(booking.totalAmount) },
    booking.depositAmount > 0
      ? { label: t('bookings.deposit'), value: euros(booking.depositAmount) }
      : undefined,
    {
      label: t('bookings.policy'),
      value: t(`cancellationPolicies.${booking.cancellationPolicy}`),
    },
  ].filter((row) => row !== undefined);

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Heading level={3}>
          {t(side === 'client' ? 'bookings.section' : 'bookings.sectionPro')}
        </Heading>
        <Badge variant={status.tone}>{status.label}</Badge>
      </View>
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
      {cancelled && booking.status === 'cancelled' ? (
        <View accessibilityRole="alert" className="rounded-2xl bg-success-muted p-3">
          <Text size="sm" tone="success">
            {t('bookings.cancelled')}
          </Text>
        </View>
      ) : null}
      {/* Côté prestataire (lot M15a), la réservation se lit seulement : l'annulation reste sur le site. */}
      {side === 'client' && canCancelBooking(booking, toIsoDate(new Date())) ? (
        cancelling ? (
          <CancelBookingForm
            booking={booking}
            onClose={() => setCancelling(false)}
            onCancelled={() => {
              setCancelling(false);
              setCancelled(true);
            }}
          />
        ) : (
          <Button variant="ghost" fullWidth onPress={() => setCancelling(true)}>
            {t('bookings.cancelBooking')}
          </Button>
        )
      ) : null}
    </View>
  );
}

/** Le motif, le remboursement prévu par la politique, puis « Confirmer l'annulation ». */
function CancelBookingForm({
  booking,
  onClose,
  onCancelled,
}: {
  booking: Booking;
  onClose(): void;
  onCancelled(): void;
}) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { fieldError, apiError } = useErrorText();
  const cancel = useCancelBooking(booking.id);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();
  const euros = (cents: number) => formatPrice(cents, locale);
  const refund = computeCancellationRefund({
    policy: booking.cancellationPolicy,
    amountPaid: booking.depositAmount,
    eventDate: booking.eventDate,
    cancelledOn: toIsoDate(new Date()),
    cancelledBy: 'client',
  });

  const submit = () => {
    const parsed = cancelBookingInputSchema.safeParse({ reason });
    setError(parsed.success ? undefined : parsed.error.issues[0]?.message);
    if (parsed.success) cancel.mutate(parsed.data, { onSuccess: onCancelled });
  };

  return (
    <Card className="gap-3 p-4">
      <Text weight="bold">{t('bookings.cancelTitle')}</Text>
      <Text size="sm" tone="muted">
        {t('bookings.cancelRefund', {
          days: refund.daysBeforeEvent,
          percent: refund.refundPercent,
          refund: euros(refund.refundAmount),
          deposit: euros(booking.depositAmount),
        })}
      </Text>
      <Text size="sm" tone="muted">
        {t('bookings.cancelOffline')}
      </Text>
      <Input
        label={t('bookings.cancelReason')}
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={500}
        error={fieldError(error)}
      />
      {cancel.isError ? (
        <Text size="sm" tone="destructive" accessibilityRole="alert">
          {apiError(cancel.error)}
        </Text>
      ) : null}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button variant="outline" size="md" fullWidth onPress={onClose}>
            {t('bookings.cancelKeep')}
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="destructive"
            size="md"
            fullWidth
            loading={cancel.isPending}
            onPress={submit}
          >
            {t('bookings.cancelConfirm')}
          </Button>
        </View>
      </View>
    </Card>
  );
}
