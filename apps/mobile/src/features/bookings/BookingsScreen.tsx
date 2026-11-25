import {
  canReviewBooking,
  daysBetween,
  formatPrice,
  toIsoDate,
  useBookings,
  useConversations,
  type BookingSummary,
} from '@afro/common';
import { useRouter } from 'expo-router';
import { CalendarDays, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import emptyImage from '../../../assets/images/aucun-resultat.webp';
import { QueryState } from '@/components/QueryState';
import { BackHeader, Badge, Button, EmptyState, Photo, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { shortDay } from '@/lib/dates';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import { conversationHref } from '../messaging/conversationHref';
import { requestHref } from '../requests/requestHref';
import { bookingStatus, isUpcomingBooking } from './bookingStatus';
import { reviewHref } from './reviewHref';

type Tab = 'upcoming' | 'past';
const TABS: readonly Tab[] = ['upcoming', 'past'];

/**
 * Mes réservations (C5) : « À venir » (la plus proche d'abord) et « Passées » (la plus récente
 * d'abord, annulées comprises). Une fois réservé, l'adresse est visible ; après l'événement,
 * « Laisser un avis » apparaît (règle n° 6).
 */
export function BookingsScreen() {
  const { t } = useTranslation();
  const bookings = useBookings('client');
  const [tab, setTab] = useState<Tab>('upcoming');

  const all = bookings.data ?? [];
  const upcoming = all
    .filter((b) => isUpcomingBooking(b.booking))
    .sort((a, b) => a.booking.eventDate.localeCompare(b.booking.eventDate));
  const past = all
    .filter((b) => !isUpcomingBooking(b.booking))
    .sort((a, b) => b.booking.eventDate.localeCompare(a.booking.eventDate));
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={t('bookings.title')} />
      <View
        accessibilityRole="tablist"
        accessibilityLabel={t('bookings.tabs')}
        className="mx-5 mt-1 flex-row gap-1 rounded-full bg-muted p-1"
      >
        {TABS.map((value) => {
          const on = tab === value;
          const n = (value === 'upcoming' ? upcoming : past).length;
          const label = t(`bookings.${value}`);
          return (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setTab(value)}
              className={cn('flex-1 items-center rounded-full py-2', on && 'bg-card')}
            >
              <Text size="xs" weight="bold" tone={on ? 'default' : 'muted'}>
                {n > 0 ? t('requests.tabCount', { label, count: n }) : label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <QueryState
        isPending={bookings.isPending}
        isError={bookings.isError}
        onRetry={() => void bookings.refetch()}
        loadingLabel={t('bookings.loading')}
      >
        <FlatList
          data={shown}
          keyExtractor={(item) => item.booking.id}
          accessibilityLabel={t('bookings.list')}
          renderItem={({ item }) =>
            tab === 'upcoming' ? <UpcomingCard summary={item} /> : <PastRow summary={item} />
          }
          contentContainerClassName="gap-3 px-5 pb-10 pt-3.5"
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={bookings.isRefetching}
              onRefresh={() => void bookings.refetch()}
            />
          }
          ListEmptyComponent={<BookingsEmpty tab={tab} />}
        />
      </QueryState>
    </SafeAreaView>
  );
}

function BookingsEmpty({ tab }: { tab: Tab }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <EmptyState
      className="flex-1"
      image={emptyImage}
      title={t(tab === 'upcoming' ? 'bookings.emptyUpcoming' : 'bookings.emptyPast')}
      description={t('bookings.emptyHint')}
      action={
        <Button size="md" onPress={() => router.navigate('/demandes')}>
          {t('bookings.seeRequests')}
        </Button>
      }
    />
  );
}

/** Une réservation à venir (maquette C5) : grande photo, date, adresse, Message et Annuler. */
function UpcomingCard({ summary }: { summary: BookingSummary }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const router = useRouter();
  const conversations = useConversations('client');
  const { booking, provider } = summary;
  const status = bookingStatus(booking);
  const days = daysBetween(toIsoDate(new Date()), booking.eventDate);
  const when = [
    shortDay(booking.eventDate, locale),
    days > 0 ? t('bookings.inDays', { count: days }) : days === 0 ? t('bookings.today') : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const price = formatPrice(booking.totalAmount, locale);
  const conversationId = conversations.data?.find(
    (c) => c.conversation.quoteRequestId === booking.quoteRequestId,
  )?.conversation.id;

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[provider.displayName, status.label, when, booking.eventAddress, price]
          .filter(Boolean)
          .join(', ')}
        onPress={() => router.push(requestHref(booking.quoteRequestId))}
        className="active:opacity-80"
      >
        <View>
          <Photo uri={provider.coverUrl} className="h-[120px] w-full" />
          <View className="absolute left-2.5 top-2.5">
            <Badge variant={status.tone}>{status.label}</Badge>
          </View>
        </View>
        <View className="gap-1.5 p-3.5 pb-0">
          <View className="flex-row items-center justify-between gap-2">
            <Text weight="bold" numberOfLines={1} className="shrink">
              {provider.displayName}
            </Text>
            <Text weight="bold" tone="primary">
              {price}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <CalendarDays size={14} color={colors['muted-foreground']} />
            <Text size="sm" tone="muted">
              {when}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <MapPin size={14} color={colors['muted-foreground']} />
            <Text size="sm" tone="muted" numberOfLines={1} className="shrink">
              {booking.eventAddress}
            </Text>
          </View>
        </View>
      </Pressable>
      <View className="flex-row gap-2 p-3.5">
        <View className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            disabled={!conversationId}
            onPress={() => conversationId && router.push(conversationHref(conversationId))}
          >
            {t('bookings.message')}
          </Button>
        </View>
        {booking.status === 'confirmed' ? (
          <View className="flex-1">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              accessibilityLabel={`${t('bookings.cancel')} ${provider.displayName}`}
              onPress={() => router.push(requestHref(booking.quoteRequestId))}
            >
              {t('bookings.cancel')}
            </Button>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Une réservation passée ou annulée : une ligne, et « Laisser un avis » quand c'est possible. */
function PastRow({ summary }: { summary: BookingSummary }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const router = useRouter();
  const userId = useSessionStore((s) => s.user?.id ?? '');
  const { booking, provider, review } = summary;
  const status = bookingStatus(booking);
  // Règle n° 6 : seulement le client, après l'événement, et un seul avis.
  const canReview = canReviewBooking({
    booking,
    userId,
    existingReviews: review ? [review] : [],
  }).allowed;
  const when = `${status.label} · ${shortDay(booking.eventDate, locale)}`;

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${provider.displayName}, ${when}`}
        onPress={() => router.push(requestHref(booking.quoteRequestId))}
        className="min-w-0 flex-1 flex-row items-center gap-3 active:opacity-80"
      >
        <Photo uri={provider.coverUrl} className="h-12 w-12 rounded-full" />
        <View className="min-w-0 flex-1">
          <Text size="sm" weight="bold" numberOfLines={1}>
            {provider.displayName}
          </Text>
          <Text size="xs" tone="muted">
            {when}
          </Text>
        </View>
      </Pressable>
      {canReview ? (
        <Button
          size="sm"
          accessibilityLabel={`${t('bookings.review')} ${provider.displayName}`}
          onPress={() => router.push(reviewHref(booking.id))}
        >
          {t('bookings.review')}
        </Button>
      ) : review ? (
        <Text size="xs" tone="muted">
          {t('bookings.reviewed', { rating: review.rating })}
        </Text>
      ) : null}
    </View>
  );
}
