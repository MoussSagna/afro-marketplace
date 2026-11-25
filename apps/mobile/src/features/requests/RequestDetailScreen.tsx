import {
  isQuoteRequestOpen,
  useCancelQuoteRequest,
  useQuoteRequest,
  type QuoteRequestDetails,
} from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { BackHeader, Badge, Button, Card, EmptyState, Heading, Photo, Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { shortDate } from '@/lib/dates';
import { useThemeColors } from '@/theme/useTheme';
import { BookingPanel } from '../bookings/BookingPanel';
import { QuoteActions } from '../bookings/QuoteActions';
import { conversationHref } from '../messaging/conversationHref';
import { QuoteCard } from '../messaging/QuoteCard';
import { requestStatus } from '../messaging/requestStatus';
import { profileHref } from '../providers/profileHref';
import { RequestInfoRows } from './RequestInfoRows';

/**
 * Le détail d'une demande (C2 → C3) : le prestataire, l'événement, le message envoyé,
 * le dernier devis, puis « Poser une question » (la conversation) et « Annuler la demande ».
 * Sous le devis : Accepter (panneau du bas) ou Refuser ; une fois réservé, « Ma réservation » (M11).
 */
export function RequestDetailScreen() {
  const { t } = useTranslation();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const details = useQuoteRequest(id);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader title={t('requests.detailTitle')} />
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
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404;
}

function RequestDetail({ details }: { details: QuoteRequestDetails }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const router = useRouter();
  const { apiError } = useErrorText();
  const { request, provider, quotes, conversationId, booking } = details;
  const cancel = useCancelQuoteRequest(request.id);
  const [confirming, setConfirming] = useState(false);
  const [answered, setAnswered] = useState<'booked' | 'declined' | null>(null);
  const status = requestStatus(request, 'client');
  const latest = [...quotes].sort((a, b) => b.version - a.version)[0];

  return (
    <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-2">
      <Card className="flex-row items-center gap-3 p-2.5">
        <Photo uri={provider.coverUrl} className="h-14 w-14 rounded-xl" />
        <View className="min-w-0 flex-1 gap-1">
          <Text
            weight="bold"
            accessibilityRole="link"
            onPress={() => router.push(profileHref(provider.slug))}
          >
            {provider.displayName}
          </Text>
          <Badge variant={status.tone}>{status.label}</Badge>
        </View>
      </Card>

      {request.status === 'cancelled' && cancel.isSuccess ? (
        <SuccessAlert color={colors.success}>{t('requests.cancelled')}</SuccessAlert>
      ) : null}
      {answered === 'booked' && booking ? (
        <SuccessAlert color={colors.success}>{t('requests.booked')}</SuccessAlert>
      ) : null}
      {answered === 'declined' ? (
        <SuccessAlert color={colors.success}>{t('requests.declined')}</SuccessAlert>
      ) : null}

      <RequestInfoRows request={request} />

      <View className="gap-1.5">
        <Heading level={3}>{t('requests.yourMessage')}</Heading>
        <Text size="sm" tone="muted">
          {request.message}
        </Text>
      </View>

      <View className="gap-2">
        <Heading level={3}>{t('requests.latestQuote')}</Heading>
        {latest ? (
          <QuoteCard quote={latest}>
            <QuoteActions
              details={details}
              quote={latest}
              onAccepted={() => setAnswered('booked')}
              onDeclined={() => setAnswered('declined')}
            />
          </QuoteCard>
        ) : (
          <Text size="sm" tone="muted">
            {t('requests.noQuote', { date: shortDate(request.expiresAt.slice(0, 10), locale) })}
          </Text>
        )}
      </View>

      {booking ? <BookingPanel booking={booking} /> : null}

      <Button
        variant="outline"
        fullWidth
        onPress={() => router.push(conversationHref(conversationId))}
      >
        {t('requests.askQuestion')}
      </Button>

      {isQuoteRequestOpen(request.status) ? (
        confirming ? (
          <Card className="gap-3 p-4">
            <Text weight="bold">{t('requests.cancelTitle')}</Text>
            <Text size="sm" tone="muted">
              {t('requests.cancelHint')}
            </Text>
            {cancel.isError ? (
              <Text size="sm" tone="destructive" accessibilityRole="alert">
                {apiError(cancel.error)}
              </Text>
            ) : null}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button variant="outline" size="md" fullWidth onPress={() => setConfirming(false)}>
                  {t('requests.cancelKeep')}
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  variant="destructive"
                  size="md"
                  fullWidth
                  loading={cancel.isPending}
                  onPress={() =>
                    cancel.mutate(undefined, { onSuccess: () => setConfirming(false) })
                  }
                >
                  {t('requests.cancelConfirm')}
                </Button>
              </View>
            </View>
          </Card>
        ) : (
          <Button variant="ghost" fullWidth onPress={() => setConfirming(true)}>
            {t('requests.cancel')}
          </Button>
        )
      ) : null}
    </ScrollView>
  );
}

function SuccessAlert({ color, children }: { color: string; children: string }) {
  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-center gap-2 rounded-2xl bg-success-muted p-3"
    >
      <CheckCircle2 size={18} color={color} />
      <Text size="sm" tone="success" className="flex-1">
        {children}
      </Text>
    </View>
  );
}
