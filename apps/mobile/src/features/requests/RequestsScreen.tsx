import { formatPrice, useQuoteRequests, type QuoteRequestSummary, type Side } from '@afro/common';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import emptyImage from '../../../assets/images/aucun-resultat.webp';
import { QueryState } from '@/components/QueryState';
import { Avatar, Badge, Button, EmptyState, Heading, Photo, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { shortDay } from '@/lib/dates';
import { requestStatus } from '../messaging/requestStatus';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { clientName } from '../pro/clientName';
import { requestUrgency } from '../pro/requestUrgency';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { requestHref } from './requestHref';
import { REQUEST_TABS, requestTab, type RequestTab } from './requestTab';
import { useThemeColors } from '@/theme/useTheme';

/** Les textes de chaque côté : « Mes demandes » (client) ou « Demandes reçues » (prestataire). */
const TEXTS = {
  client: {
    title: 'requests.title',
    tabs: { open: 'requests.tabOpen', booked: 'requests.tabBooked', closed: 'requests.tabClosed' },
    empty: {
      open: 'requests.emptyOpen',
      booked: 'requests.emptyBooked',
      closed: 'requests.emptyClosed',
    },
    emptyHint: 'requests.emptyHint',
  },
  provider: {
    title: 'proRequests.title',
    tabs: {
      open: 'requests.tabOpen',
      booked: 'requests.tabBooked',
      closed: 'proRequests.tabClosed',
    },
    empty: {
      open: 'proRequests.emptyOpen',
      booked: 'proRequests.emptyBooked',
      closed: 'proRequests.emptyClosed',
    },
    emptyHint: 'proRequests.emptyHint',
  },
} as const;

/**
 * L'onglet Demandes, des deux côtés, comme sur le site :
 * - client (C2, « Mes demandes ») : une carte par prestataire ; en haut à droite,
 *   « Mes réservations » (C5, lot M11) ;
 * - prestataire (S3, « Demandes reçues », lot M14) : une carte par client, avec le badge
 *   d'urgence du tableau de bord (rouge avant expiration).
 * Trois onglets : en cours, réservées, terminées (« archivées » côté prestataire).
 */
export function RequestsScreen({
  side = 'client',
  withBack = false,
}: {
  side?: Side;
  /** Ouvert par-dessus les onglets (client, depuis Profil) : un bouton « Retour » avant le titre. */
  withBack?: boolean;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const requests = useQuoteRequests(side);
  const texts = TEXTS[side];
  const onScroll = useCollapseOnScroll();
  const [tab, setTab] = useState<RequestTab>('open');

  const all = requests.data ?? [];
  const count = (value: RequestTab) =>
    all.filter((r) => requestTab(r.request.status) === value).length;
  const shown = all.filter((r) => requestTab(r.request.status) === tab);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 pt-2">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row items-center gap-3">
            {withBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/compte'))}
                className="min-h-touch min-w-touch items-center justify-center rounded-full border border-border bg-card"
              >
                <ChevronLeft size={22} color={colors.foreground} />
              </Pressable>
            ) : null}
            <Heading className="shrink">{t(texts.title)}</Heading>
          </View>
          {side === 'client' ? (
            <Button variant="secondary" size="sm" onPress={() => router.push('/reservations')}>
              {t('requests.myBookings')}
            </Button>
          ) : null}
        </View>
        <View
          accessibilityRole="tablist"
          accessibilityLabel={t('requests.tabs')}
          className="mt-3.5 flex-row gap-1 rounded-full bg-muted p-1"
        >
          {REQUEST_TABS.map((value) => {
            const on = tab === value;
            const n = count(value);
            const label = t(texts.tabs[value]);
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
      </View>
      <QueryState
        isPending={requests.isPending}
        isError={requests.isError}
        onRetry={() => void requests.refetch()}
        loadingLabel={t('requests.loading')}
      >
        <FlatList
          data={shown}
          keyExtractor={(item) => item.request.id}
          accessibilityLabel={t('requests.list')}
          renderItem={({ item }) => <RequestCard summary={item} side={side} />}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerClassName="gap-2.5 px-5 pt-3.5"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={requests.isRefetching}
              onRefresh={() => void requests.refetch()}
            />
          }
          ListEmptyComponent={
            <EmptyState
              className="flex-1"
              image={emptyImage}
              title={t(texts.empty[tab])}
              description={t(texts.emptyHint)}
              action={
                side === 'client' ? (
                  <Button size="md" onPress={() => router.navigate('/')}>
                    {t('requests.findProvider')}
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </QueryState>
    </SafeAreaView>
  );
}

function RequestCard({ summary, side }: { summary: QuoteRequestSummary; side: Side }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const router = useRouter();
  const { request, provider, client, latestQuote } = summary;
  const isClient = side === 'client';
  const name = isClient ? provider.displayName : clientName(client);
  const status = isClient ? requestStatus(request, 'client') : requestUrgency(request);
  const event = [
    t(`eventTypes.${request.eventType}`),
    shortDay(request.eventDate, locale),
    request.guestCount ? t('search.guests', { count: request.guestCount }) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  const quote =
    latestQuote && latestQuote.status !== 'superseded'
      ? t('requests.quoteTotal', { total: formatPrice(latestQuote.totalAmount, locale) })
      : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[name, status.label, event, quote].filter(Boolean).join(', ')}
      onPress={() => router.push(requestHref(request.id, side))}
      className="flex-row gap-3 rounded-2xl border border-border bg-card p-2.5 active:opacity-80"
    >
      {isClient ? (
        <Photo uri={provider.coverUrl} className="h-[72px] w-[72px] rounded-xl" />
      ) : (
        <View className="h-[72px] w-[60px] items-center justify-center">
          <Avatar name={name} uri={client.avatarUrl} />
        </View>
      )}
      <View className="min-w-0 flex-1 justify-center gap-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text size="sm" weight="bold" numberOfLines={1} className="shrink">
            {name}
          </Text>
          <Badge variant={status.tone}>{status.label}</Badge>
        </View>
        <Text size="xs" tone="muted" numberOfLines={1}>
          {event}
        </Text>
        {quote ? (
          <Text size="xs" weight="semibold" tone="primary">
            {quote}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
