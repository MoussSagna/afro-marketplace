import {
  ApiError,
  isQuoteRequestOpen,
  useMyProviderProfile,
  useQuoteRequest,
  useUnavailableDates,
  type QuoteRequestDetails,
} from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarCheck, CalendarX, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { Avatar, BackHeader, Badge, Button, EmptyState, Heading, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { shortDate } from '@/lib/dates';
import { useThemeColors } from '@/theme/useTheme';
import { conversationHref } from '../messaging/conversationHref';
import { QuoteCard } from '../messaging/QuoteCard';
import { RequestInfoRows } from '../requests/RequestInfoRows';
import { clientName } from './clientName';
import { DeclineRequestSheet } from './DeclineRequestSheet';
import { requestUrgency } from './requestUrgency';

/**
 * Le détail d'une demande reçue (S3, lot M14), par-dessus les onglets pro :
 * - le client, le badge (rouge avant expiration) et la date de réception ;
 * - l'événement, son message, et si le prestataire est libre ce jour-là (son agenda) ;
 * - le dernier devis envoyé, s'il y en a un ;
 * - en bas : « Message » (la conversation) et « Décliner » (avec un motif).
 * L'envoi d'un devis arrive au lot M14b.
 */
export function ProRequestDetailScreen() {
  const { t } = useTranslation();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const details = useQuoteRequest(id);
  const name = details.data ? clientName(details.data.client) : '';
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={name ? t('proRequests.detailTitle', { name }) : ''} />
      <QueryState
        isPending={details.isPending}
        isError={details.isError && !isNotFound(details.error)}
        onRetry={() => void details.refetch()}
        loadingLabel={t('requests.loading')}
      >
        {details.data ? (
          <RequestDetail details={details.data} />
        ) : (
          <EmptyState className="flex-1" title={t('requests.notFound')} />
        )}
      </QueryState>
    </SafeAreaView>
  );
}

function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function RequestDetail({ details }: { details: QuoteRequestDetails }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const router = useRouter();
  const { request, client, quotes, conversationId } = details;
  const [declining, setDeclining] = useState(false);
  const [declined, setDeclined] = useState(false);
  const name = clientName(client);
  const urgency = requestUrgency(request);
  const latest = [...quotes].sort((a, b) => b.version - a.version)[0];
  const open = isQuoteRequestOpen(request.status);

  return (
    <>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-6 pt-2">
        <View className="flex-row items-center gap-3">
          <Avatar name={name} uri={client.avatarUrl} />
          <View className="min-w-0 flex-1 gap-0.5">
            <Text weight="bold" numberOfLines={1}>
              {name}
            </Text>
            <Text size="xs" tone="muted">
              {t('proRequests.receivedOn', {
                date: shortDate(request.createdAt.slice(0, 10), locale),
              })}
            </Text>
          </View>
          <Badge variant={urgency.tone}>{urgency.label}</Badge>
        </View>

        {declined && request.status === 'declined' ? (
          <View
            accessibilityRole="alert"
            className="flex-row items-center gap-2 rounded-2xl bg-success-muted p-3"
          >
            <CheckCircle2 size={18} color={colors.success} />
            <Text size="sm" tone="success" className="flex-1">
              {t('proRequests.declined')}
            </Text>
          </View>
        ) : null}
        {request.status === 'declined' && request.declineReason ? (
          <View className="rounded-2xl bg-muted p-3">
            <Text size="sm">
              {t('proRequests.declineReasonShown', { reason: request.declineReason })}
            </Text>
          </View>
        ) : null}
        {request.status === 'expired' ? (
          <View className="rounded-2xl bg-muted p-3">
            <Text size="sm">{t('proRequests.expired')}</Text>
          </View>
        ) : null}

        <RequestInfoRows request={request} withClientType />

        <View className="gap-1.5">
          <Heading level={3}>{t('proRequests.theirMessage')}</Heading>
          <Text size="sm" tone="muted">
            {request.message}
          </Text>
        </View>

        {open ? <Availability providerId={details.provider.id} date={request.eventDate} /> : null}

        {latest ? (
          <View className="gap-2">
            <Heading level={3}>{t('proRequests.latestQuote')}</Heading>
            <QuoteCard quote={latest} />
          </View>
        ) : null}

        {request.status === 'pending' ? (
          <Text size="xs" tone="muted" className="text-center">
            {t('proRequests.expiresOn', {
              date: shortDate(request.expiresAt.slice(0, 10), locale),
            })}
          </Text>
        ) : null}
      </ScrollView>

      <View className="flex-row gap-2 border-t border-border bg-background px-5 pb-2 pt-3">
        <View className="flex-1">
          <Button
            variant={request.status === 'pending' ? 'ghost' : 'cta'}
            fullWidth
            onPress={() => router.push(conversationHref(conversationId, 'provider'))}
          >
            {t('proRequests.message')}
          </Button>
        </View>
        {request.status === 'pending' ? (
          <View className="flex-1">
            <Button variant="outline" fullWidth onPress={() => setDeclining(true)}>
              {t('proRequests.decline')}
            </Button>
          </View>
        ) : null}
      </View>

      <DeclineRequestSheet
        requestId={request.id}
        visible={declining}
        onClose={() => setDeclining(false)}
        onDeclined={() => {
          setDeclining(false);
          setDeclined(true);
        }}
      />
    </>
  );
}

/**
 * Le prestataire est-il libre ce jour-là (maquette S3) ? On lit ses jours indisponibles
 * (jours bloqués, ou complets selon son « max par jour »), comme la recherche des clients.
 */
function Availability({ providerId, date }: { providerId: string; date: string }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const unavailable = useUnavailableDates(providerId, { from: date, to: date });
  const profile = useMyProviderProfile();
  if (unavailable.isPending) {
    return (
      <Text size="sm" tone="muted">
        {t('proRequests.checking')}
      </Text>
    );
  }
  if (unavailable.isError) return null;
  const free = !unavailable.data.includes(date);
  const max = profile.data?.profile.maxBookingsPerDay ?? 1;
  return (
    <View
      accessible
      className={
        free
          ? 'flex-row items-center gap-2 rounded-2xl bg-success-muted p-3'
          : 'flex-row items-center gap-2 rounded-2xl bg-muted p-3'
      }
    >
      {free ? (
        <CalendarCheck size={18} color={colors.success} />
      ) : (
        <CalendarX size={18} color={colors.destructive} />
      )}
      <Text size="sm" weight="semibold" tone={free ? 'success' : 'destructive'} className="flex-1">
        {free ? t('proRequests.available', { count: max }) : t('proRequests.unavailable')}
      </Text>
    </View>
  );
}
