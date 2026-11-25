import {
  formatPrice,
  useMyProviderProfile,
  useProviderDashboard,
  type BookingSummary,
  type QuoteRequestSummary,
} from '@afro/common';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { Avatar, Badge, Card, Heading, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { formatRating } from '@/lib/cn';
import { dateBlock, shortDay } from '@/lib/dates';
import { useSessionStore } from '@/stores/session';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { requestsToHandle, requestUrgency } from './requestUrgency';

/**
 * Le tableau de bord du prestataire (S2, lot M13), premier onglet du mode pro :
 * - « Bonjour Moussa », le nom commercial et l'état du profil (« En ligne ») ;
 * - les 3 chiffres du site : demandes à traiter, réservations à venir, note ;
 * - « À traiter » : les demandes en attente, la plus urgente d'abord (rouge avant expiration) ;
 * - « Prochaines dates » : les réservations confirmées à venir.
 */
export function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const firstName = useSessionStore((s) => s.user?.firstName ?? '');
  const dashboard = useProviderDashboard();
  const profile = useMyProviderProfile();
  const onScroll = useCollapseOnScroll();
  const data = dashboard.data;
  const provider = profile.data?.profile;
  const toHandle = data ? requestsToHandle(data.recentRequests) : [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <QueryState
        isPending={dashboard.isPending}
        isError={dashboard.isError}
        onRetry={() => void dashboard.refetch()}
        loadingLabel={t('pro.loading')}
      >
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerClassName="gap-5 px-5 pt-2"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
          refreshControl={
            <RefreshControl
              refreshing={dashboard.isRefetching}
              onRefresh={() => void dashboard.refetch()}
            />
          }
        >
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text size="sm" tone="muted">
                {t('pro.hello', { name: firstName })}
              </Text>
              <Heading numberOfLines={1}>{provider?.displayName ?? ''}</Heading>
            </View>
            {provider ? (
              <Badge variant={provider.status === 'published' ? 'success' : 'warning'}>
                {t(`pro.status.${provider.status}`)}
              </Badge>
            ) : null}
          </View>

          {data ? (
            <View accessibilityLabel={t('pro.stats')} className="flex-row gap-2.5">
              <Stat
                value={String(data.pendingRequestsCount)}
                label={t('pro.pending', { count: data.pendingRequestsCount })}
              />
              <Stat
                value={String(data.upcomingBookingsCount)}
                label={t('pro.upcoming', { count: data.upcomingBookingsCount })}
              />
              <Stat
                value={data.ratingCount > 0 ? formatRating(data.ratingAverage) : '–'}
                label={
                  data.ratingCount > 0
                    ? t('pro.rating', { count: data.ratingCount })
                    : t('pro.noRating')
                }
              />
            </View>
          ) : null}

          <View className="gap-2.5">
            <View className="flex-row items-baseline justify-between">
              <Heading level={3}>{t('pro.toHandle')}</Heading>
              <Text
                size="sm"
                weight="semibold"
                tone="primary"
                accessibilityRole="link"
                onPress={() => router.navigate('/pro/demandes')}
              >
                {t('pro.seeAll')}
              </Text>
            </View>
            {toHandle.length === 0 ? (
              <Text size="sm" tone="muted">
                {t('pro.nothingToHandle')}
              </Text>
            ) : (
              toHandle.map((summary) => <RequestRow key={summary.request.id} summary={summary} />)
            )}
          </View>

          <View className="gap-2.5">
            <Heading level={3}>{t('pro.nextDates')}</Heading>
            {data && data.upcomingBookings.length > 0 ? (
              data.upcomingBookings.map((summary) => (
                <BookingRow key={summary.booking.id} summary={summary} />
              ))
            ) : (
              <Text size="sm" tone="muted">
                {t('pro.noNextDates')}
              </Text>
            )}
          </View>
        </ScrollView>
      </QueryState>
    </SafeAreaView>
  );
}

/** Un des 3 chiffres : le nombre en grand, son libellé dessous. */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card className="flex-1 gap-0.5 p-3" accessible accessibilityLabel={`${value} ${label}`}>
      <Text weight="bold" className="font-serif text-h2">
        {value}
      </Text>
      <Text size="xs" tone="muted">
        {label}
      </Text>
    </Card>
  );
}

function clientName(client: { firstName: string; lastNameInitial: string }) {
  return `${client.firstName} ${client.lastNameInitial}.`;
}

/** Une demande à traiter : la cliente, l'événement, et le badge d'urgence. */
function RequestRow({ summary }: { summary: QuoteRequestSummary }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { request, client } = summary;
  const name = clientName(client);
  const title = `${name} · ${t(`eventTypes.${request.eventType}`)}`;
  const detail = [
    shortDay(request.eventDate, locale),
    request.guestCount ? t('search.guests', { count: request.guestCount }) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  const urgency = requestUrgency(request);
  return (
    <Card
      className="flex-row items-center gap-3 p-3"
      accessible
      accessibilityLabel={`${title}, ${detail}, ${urgency.label}`}
    >
      <Avatar name={name} uri={client.avatarUrl} size="sm" />
      <View className="min-w-0 flex-1">
        <Text size="sm" weight="bold" numberOfLines={1}>
          {title}
        </Text>
        <Text size="xs" tone="muted">
          {detail}
        </Text>
      </View>
      <Badge variant={urgency.tone}>{urgency.label}</Badge>
    </Card>
  );
}

/** Une prochaine date : pastille « DÉC. 7 », la cliente, le lieu et le montant. */
function BookingRow({ summary }: { summary: BookingSummary }) {
  const { locale } = useLanguage();
  const { booking, client } = summary;
  const block = dateBlock(booking.eventDate, locale);
  const price = formatPrice(booking.totalAmount, locale);
  const name = clientName(client);
  return (
    <Card
      className="flex-row items-center gap-3 p-3"
      accessible
      accessibilityLabel={`${shortDay(booking.eventDate, locale)}, ${name}, ${booking.eventAddress}, ${price}`}
    >
      <View className="w-12 items-center rounded-xl bg-muted py-1.5">
        <Text size="caption" tone="muted">
          {block.month}
        </Text>
        <Text weight="bold">{block.day}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text size="sm" weight="bold" numberOfLines={1}>
          {name}
        </Text>
        <Text size="xs" tone="muted" numberOfLines={1}>
          {booking.eventAddress}
        </Text>
      </View>
      <Text size="sm" weight="bold" tone="primary">
        {price}
      </Text>
    </Card>
  );
}
