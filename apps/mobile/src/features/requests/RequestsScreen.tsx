import { formatPrice, useQuoteRequests, type QuoteRequestSummary } from '@afro/common';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import emptyImage from '../../../assets/images/aucun-resultat.webp';
import { QueryState } from '@/components/QueryState';
import { Badge, Button, EmptyState, Heading, Photo, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { shortDay } from '@/lib/dates';
import { requestStatus } from '../messaging/requestStatus';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { requestHref } from './requestHref';
import { REQUEST_TABS, requestTab, type RequestTab } from './requestTab';

const TAB_LABELS = {
  open: 'requests.tabOpen',
  booked: 'requests.tabBooked',
  closed: 'requests.tabClosed',
} as const;
const EMPTY_TITLES = {
  open: 'requests.emptyOpen',
  booked: 'requests.emptyBooked',
  closed: 'requests.emptyClosed',
} as const;

/**
 * L'onglet Demandes (C2, maquette « Mes demandes ») : trois onglets comme sur le site
 * (en cours, réservées, terminées), et une carte par demande avec son badge.
 * En haut à droite : « Mes réservations » (C5, lot M11).
 */
export function RequestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const requests = useQuoteRequests('client');
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
          <Heading>{t('requests.title')}</Heading>
          <Button variant="secondary" size="sm" onPress={() => router.push('/reservations')}>
            {t('requests.myBookings')}
          </Button>
        </View>
        <View
          accessibilityRole="tablist"
          accessibilityLabel={t('requests.tabs')}
          className="mt-3.5 flex-row gap-1 rounded-full bg-muted p-1"
        >
          {REQUEST_TABS.map((value) => {
            const on = tab === value;
            const n = count(value);
            const label = t(TAB_LABELS[value]);
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
          renderItem={({ item }) => <RequestCard summary={item} />}
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
              title={t(EMPTY_TITLES[tab])}
              description={t('requests.emptyHint')}
              action={
                <Button size="md" onPress={() => router.navigate('/recherche')}>
                  {t('requests.findProvider')}
                </Button>
              }
            />
          }
        />
      </QueryState>
    </SafeAreaView>
  );
}

function RequestCard({ summary }: { summary: QuoteRequestSummary }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const router = useRouter();
  const { request, provider, latestQuote } = summary;
  const status = requestStatus(request, 'client');
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
      accessibilityLabel={[provider.displayName, status.label, event, quote]
        .filter(Boolean)
        .join(', ')}
      onPress={() => router.push(requestHref(request.id))}
      className="flex-row gap-3 rounded-2xl border border-border bg-card p-2.5 active:opacity-80"
    >
      <Photo uri={provider.coverUrl} className="h-[72px] w-[72px] rounded-xl" />
      <View className="min-w-0 flex-1 justify-center gap-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text size="sm" weight="bold" numberOfLines={1} className="shrink">
            {provider.displayName}
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
