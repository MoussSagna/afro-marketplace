import {
  canRequestEventQuote,
  useCategories,
  useEvent,
  useRequestEventQuotes,
  type EventDetails,
} from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Send } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryState } from '@/components/QueryState';
import { Button, Card, EmptyState, Input, Photo, Text } from '@/components/ui';
import { useCategoryName } from '@/i18n/useCategoryName';
import { useErrorText } from '@/i18n/useErrorText';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { eventDay } from '@/lib/dates';
import { toast } from '@/stores/toasts';
import { useThemeColors } from '@/theme/useTheme';
import { EventProviderStatusBadge } from './EventBadges';
import { EventBottomBar, EventHeader } from './EventChrome';

/**
 * Demander les devis en une fois (/evenements/:id/devis), comme sur le site : une case par
 * prestataire qu'on peut contacter (déjà cochée), un message facultatif, puis « Envoyer ».
 * Chaque case crée une VRAIE demande de devis (mêmes règles qu'une demande classique), via
 * `useRequestEventQuotes`. Pas de réservation ici.
 */
export function RequestQuotesScreen() {
  const { eventId = '' } = useLocalSearchParams<{ eventId: string }>();
  const { t } = useTranslation();
  const details = useEvent(eventId);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <EventHeader
        title={t('events.quotes.title')}
        subtitle={t('events.quotes.subtitle')}
        fallback={{ pathname: '/evenements/[eventId]', params: { eventId } }}
      />
      <QueryState
        isPending={details.isPending}
        isError={details.isError}
        onRetry={() => void details.refetch()}
        loadingLabel={t('events.detail.loading')}
      >
        {details.data ? <RequestQuotesForm details={details.data} /> : null}
      </QueryState>
    </SafeAreaView>
  );
}

function RequestQuotesForm({ details }: { details: EventDetails }) {
  const { event, providers } = details;
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { apiError } = useErrorText();
  const router = useRouter();
  const colors = useThemeColors();
  const categoryName = useCategoryName();
  const categories = useCategories().data ?? [];
  const eligible = providers
    .filter((p) => canRequestEventQuote(p.status))
    .map((p) => p.provider.id);
  // Les prestataires à contacter d'abord, ceux déjà contactés ensuite (non cochables).
  const sorted = [...providers].sort(
    (a, b) => Number(canRequestEventQuote(b.status)) - Number(canRequestEventQuote(a.status)),
  );
  const [selected, setSelected] = useState(() => new Set(eligible));
  const [message, setMessage] = useState('');
  const send = useRequestEventQuotes(event.id);
  const count = selected.size;
  const allSelected = eligible.length > 0 && count === eligible.length;
  const nameOf = (id: string) =>
    providers.find((p) => p.provider.id === id)?.provider.displayName ?? id;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function submit() {
    send.mutate(
      { providerIds: [...selected], ...(message.trim() && { message: message.trim() }) },
      {
        onSuccess: (result) => {
          if (router.canGoBack()) router.back();
          else router.replace({ pathname: '/evenements/[eventId]', params: { eventId: event.id } });
          if (result.sent.length) {
            toast({
              title:
                result.sent.length > 1 ? t('events.quotes.sentMany') : t('events.quotes.sentOne'),
              description:
                result.failed.length === 0
                  ? t('events.quotes.sentHint', { count: result.sent.length })
                  : t('events.quotes.partial', {
                      sent: result.sent.map((s) => nameOf(s.providerId)).join(', '),
                      failed: result.failed
                        .map((f) => `${nameOf(f.providerId)} (${f.message.replace(/\.$/, '')})`)
                        .join(', '),
                    }),
            });
          } else {
            toast({
              tone: 'info',
              title: t('events.quotes.noneSent'),
              description: result.failed
                .map((f) => `${nameOf(f.providerId)} : ${f.message}`)
                .join(' '),
            });
          }
        },
      },
    );
  }

  if (eligible.length === 0) {
    return (
      <EmptyState
        title={t('events.quotes.none')}
        description={t('events.quotes.noneHint')}
        action={
          <Button
            variant="outline"
            size="md"
            onPress={() =>
              router.replace({
                pathname: '/evenements/[eventId]/ajouter',
                params: { eventId: event.id },
              })
            }
          >
            {t('events.detail.addProvider')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-6 pt-2"
          keyboardShouldPersistTaps="handled"
          testID="request-quotes"
        >
          <View className="flex-row items-center justify-between">
            <Text size="sm" weight="semibold" accessibilityLiveRegion="polite">
              {t('events.quotes.selected', { count })}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelected(allSelected ? new Set() : new Set(eligible))}
              hitSlop={8}
              className="min-h-touch justify-center"
            >
              <Text size="sm" weight="semibold" tone="primary">
                {allSelected ? t('events.quotes.unselectAll') : t('events.quotes.selectAll')}
              </Text>
            </Pressable>
          </View>

          <View className="gap-2.5">
            {sorted.map(({ provider, status }) => {
              const can = canRequestEventQuote(status);
              const checked = selected.has(provider.id);
              const category = categories.find((c) => c.id === provider.categoryIds[0]);
              const subtitle = category ? categoryName(category) : provider.city;
              return (
                <Pressable
                  key={provider.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked, disabled: !can }}
                  accessibilityLabel={`${provider.displayName}, ${subtitle}`}
                  disabled={!can}
                  onPress={() => toggle(provider.id)}
                  className={cn(
                    'flex-row items-center gap-3 rounded-2xl border bg-card p-3',
                    checked ? 'border-cta bg-secondary' : 'border-border',
                    !can && 'opacity-60',
                  )}
                >
                  <View
                    className={cn(
                      'h-6 w-6 items-center justify-center rounded-md border-[1.5px]',
                      checked ? 'border-cta bg-cta' : 'border-input bg-card',
                    )}
                  >
                    {checked ? (
                      <Check size={16} color={colors['cta-foreground']} strokeWidth={3} />
                    ) : null}
                  </View>
                  <Photo uri={provider.coverUrl} className="h-12 w-12 rounded-xl" />
                  <View className="flex-1 gap-0.5">
                    <Text weight="bold" numberOfLines={1}>
                      {provider.displayName}
                    </Text>
                    <Text size="xs" tone="muted" numberOfLines={1}>
                      {subtitle}
                    </Text>
                    {!can ? <EventProviderStatusBadge status={status} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Input
            label={t('events.quotes.message')}
            value={message}
            onChangeText={setMessage}
            placeholder={t('events.quotes.messagePlaceholder')}
            hint={t('events.quotes.messageHint')}
            multiline
            maxLength={2000}
            className="min-h-[96px]"
            textAlignVertical="top"
          />

          {/* Le récapitulatif : l'événement tel qu'il sera présenté aux prestataires. */}
          <Card className="gap-1">
            <Text size="sm" weight="bold">
              {t('events.quotes.recap')}
            </Text>
            <Text size="sm">{`${event.name} · ${t(`events.types.${event.type}`)}`}</Text>
            <Text size="sm" tone="muted">
              {[
                eventDay(event.date, locale),
                `${event.city} (${event.postalCode})`,
                t('events.guests', { count: event.guestCount }),
                event.budget ? t(`events.budgets.${event.budget}`) : undefined,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </Card>

          {send.isError ? (
            <Text size="sm" tone="destructive" accessibilityRole="alert">
              {apiError(send.error) ?? t('events.quotes.sendError')}
            </Text>
          ) : null}
          <Text size="xs" tone="muted" className="text-center">
            {t('events.detail.noBooking')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <EventBottomBar>
        <Button
          fullWidth
          size="md"
          disabled={count === 0}
          loading={send.isPending}
          onPress={submit}
          icon={<Send size={18} color={colors['cta-foreground']} />}
        >
          {t('events.quotes.send')}
        </Button>
      </EventBottomBar>
    </>
  );
}
