import {
  formatPrice,
  useBlockDate,
  useBookings,
  useMyProviderProfile,
  useMyUnavailabilities,
  useUnblockDate,
  useUpdateMyProviderProfile,
  type BookingSummary,
} from '@afro/common';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Heading, Input, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import {
  isoDay,
  longDay,
  monthGrid,
  monthRange,
  monthTitle,
  shortDay,
  todayIso,
  weekdayInitials,
} from '@/lib/dates';
import { useThemeColors } from '@/theme/useTheme';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { requestHref } from '../requests/requestHref';
import { clientName } from './clientName';

type Month = { year: number; month: number };

/**
 * L'agenda du prestataire (S6, lot M15a), 4e onglet du mode pro :
 * - le mois en grand : réservé (terre), bloqué (hachuré, barré), libre ;
 * - toucher un jour libre le bloque, un jour bloqué le libère, un jour réservé ouvre la demande ;
 * - dessous : les réservations du mois, puis le réglage « réservations max par jour » (règle n° 3).
 * Mêmes règles que la page Agenda du site.
 */
export function AgendaScreen({ today = todayIso() }: { today?: string }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const router = useRouter();
  const { apiError } = useErrorText();
  const onScroll = useCollapseOnScroll();
  const [month, setMonth] = useState<Month>({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)) - 1,
  });
  const range = monthRange(month.year, month.month);
  const unavailabilities = useMyUnavailabilities(range);
  const bookings = useBookings('provider');
  const block = useBlockDate();
  const unblock = useUnblockDate();
  const busy = block.isPending || unblock.isPending;
  const error = block.error ?? unblock.error;
  const isCurrentMonth = range.from <= today;

  const manualByDay = new Map(
    (unavailabilities.data ?? []).filter((u) => u.reason === 'manual').map((u) => [u.date, u]),
  );
  const bookingsByDay = new Map<string, BookingSummary[]>();
  for (const summary of bookings.data ?? []) {
    const { status, eventDate } = summary.booking;
    if (status !== 'confirmed' || eventDate < range.from || eventDate > range.to) continue;
    bookingsByDay.set(eventDate, [...(bookingsByDay.get(eventDate) ?? []), summary]);
  }
  const monthBookings = [...bookingsByDay.values()]
    .flat()
    .sort((a, b) => a.booking.eventDate.localeCompare(b.booking.eventDate));

  const move = (delta: number) => {
    const next = new Date(Date.UTC(month.year, month.month + delta, 1));
    setMonth({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  };
  const openBooking = (summary: BookingSummary) =>
    router.push(requestHref(summary.booking.quoteRequestId, 'provider'));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerClassName="gap-4 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
      >
        <View className="flex-row items-center justify-between">
          <Heading>{t('agenda.title')}</Heading>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('calendar.previousMonth')}
              accessibilityState={{ disabled: isCurrentMonth }}
              disabled={isCurrentMonth}
              onPress={() => move(-1)}
              className={cn(
                'min-h-touch min-w-touch items-center justify-center rounded-full border border-border bg-card',
                isCurrentMonth && 'opacity-40',
              )}
            >
              <ChevronLeft size={20} color={colors.foreground} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('calendar.nextMonth')}
              onPress={() => move(1)}
              className="min-h-touch min-w-touch items-center justify-center rounded-full border border-border bg-card"
            >
              <ChevronRight size={20} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <Heading level={3} accessibilityLiveRegion="polite">
          {monthTitle(month.year, month.month, locale)}
        </Heading>

        <View>
          <View className="flex-row" importantForAccessibility="no-hide-descendants">
            {weekdayInitials(locale).map((initial, index) => (
              <Text
                key={index}
                size="caption"
                weight="semibold"
                tone="muted"
                className="flex-1 text-center"
              >
                {initial}
              </Text>
            ))}
          </View>
          <View accessibilityLabel={t('agenda.grid')} className="mt-1 flex-row flex-wrap">
            {monthGrid(month.year, month.month).map((day, index) => {
              if (day === null) return <View key={`blank-${index}`} className="h-12 w-[14.28%]" />;
              const iso = isoDay(month.year, month.month, day);
              const label = longDay(iso, locale);
              const past = iso < today;
              const booked = bookingsByDay.get(iso) ?? [];
              const manual = manualByDay.get(iso);
              const state = booked.length > 0 ? 'booked' : manual ? 'blocked' : 'free';
              const a11y =
                state === 'booked'
                  ? t('agenda.booked', { day: label, count: booked.length })
                  : past
                    ? t('agenda.past', { day: label })
                    : t(`agenda.${state}`, { day: label });
              return (
                <View key={iso} className="h-12 w-[14.28%] p-0.5">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={a11y}
                    accessibilityState={{
                      disabled: past && state !== 'booked',
                      selected: state === 'blocked',
                    }}
                    disabled={(past && state !== 'booked') || (state !== 'booked' && busy)}
                    onPress={() => {
                      if (state === 'booked') openBooking(booked[0]!);
                      else if (manual) unblock.mutate(manual.id);
                      else block.mutate(iso);
                    }}
                    className={cn(
                      'flex-1 items-center justify-center rounded-lg active:opacity-70',
                      state === 'booked' && 'bg-primary',
                      state === 'blocked' && 'bg-secondary',
                      state === 'free' && !past && 'border border-border bg-card',
                      iso === today && 'border-2 border-ring',
                    )}
                  >
                    <Text
                      size="sm"
                      weight={state === 'booked' ? 'bold' : 'medium'}
                      tone={state === 'booked' ? 'inverse' : past ? 'muted' : 'default'}
                      className={cn(
                        state === 'blocked' && 'line-through',
                        past && state !== 'booked' && 'opacity-50',
                      )}
                    >
                      {String(day)}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        <View className="flex-row gap-4" importantForAccessibility="no-hide-descendants">
          <Legend className="bg-primary" label={t('agenda.legendBooked')} />
          <Legend className="bg-secondary" label={t('agenda.legendBlocked')} />
          <Legend className="border border-border bg-card" label={t('agenda.legendFree')} />
        </View>
        {error ? (
          <Text size="sm" tone="destructive" accessibilityRole="alert">
            {apiError(error)}
          </Text>
        ) : null}

        <View className="gap-2">
          <Heading level={3}>{t('agenda.monthBookings')}</Heading>
          {monthBookings.length === 0 ? (
            <Text size="sm" tone="muted">
              {t('agenda.noMonthBookings')}
            </Text>
          ) : (
            monthBookings.map((summary) => (
              <BookingRow
                key={summary.booking.id}
                summary={summary}
                onPress={() => openBooking(summary)}
              />
            ))
          )}
        </View>

        <MaxPerDaySetting />
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={cn('h-3 w-3 rounded', className)} />
      <Text size="xs" tone="muted">
        {label}
      </Text>
    </View>
  );
}

/** Une réservation du mois : « sam. 14 déc. · Aïssatou D. », le lieu et le montant. */
function BookingRow({ summary, onPress }: { summary: BookingSummary; onPress(): void }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { booking, client } = summary;
  const title = t('agenda.bookingTitle', {
    date: shortDay(booking.eventDate, locale),
    name: clientName(client),
  });
  const price = formatPrice(booking.totalAmount, locale);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${booking.eventAddress}, ${price}`}
      onPress={onPress}
      className="active:opacity-80"
    >
      <Card className="flex-row items-center gap-3 p-3">
        <View className="min-w-0 flex-1">
          <Text size="sm" weight="bold" numberOfLines={1}>
            {title}
          </Text>
          <Text size="xs" tone="muted" numberOfLines={1}>
            {booking.eventAddress}
          </Text>
        </View>
        <Text size="sm" weight="bold" tone="primary">
          {price}
        </Text>
      </Card>
    </Pressable>
  );
}

/** Le réglage « réservations max par jour » (règle n° 3) : de 1 à 20. */
function MaxPerDaySetting() {
  const { t } = useTranslation();
  const { apiError } = useErrorText();
  const profile = useMyProviderProfile();
  const update = useUpdateMyProviderProfile();
  const [draft, setDraft] = useState<string | null>(null);
  const current = profile.data?.profile.maxBookingsPerDay;
  const value = draft ?? (current === undefined ? '' : String(current));
  const parsed = Number(value);
  const valid = /^\d+$/.test(value) && parsed >= 1 && parsed <= 20;
  const changed = draft !== null && parsed !== current;

  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-end gap-3">
        <Input
          containerClassName="flex-1"
          label={t('agenda.maxPerDay')}
          keyboardType="number-pad"
          maxLength={2}
          value={value}
          onChangeText={setDraft}
          error={draft !== null && !valid ? t('agenda.maxPerDayInvalid') : undefined}
        />
        {changed ? (
          <Button
            size="md"
            variant="outline"
            disabled={!valid}
            loading={update.isPending}
            onPress={() =>
              update.mutate({ maxBookingsPerDay: parsed }, { onSuccess: () => setDraft(null) })
            }
          >
            {t('agenda.save')}
          </Button>
        ) : null}
      </View>
      {update.isError ? (
        <Text size="sm" tone="destructive" accessibilityRole="alert">
          {apiError(update.error)}
        </Text>
      ) : (
        <Text size="xs" tone="muted" accessibilityLiveRegion="polite">
          {update.isSuccess && draft === null ? t('agenda.saved') : t('agenda.maxPerDayHint')}
        </Text>
      )}
    </Card>
  );
}
