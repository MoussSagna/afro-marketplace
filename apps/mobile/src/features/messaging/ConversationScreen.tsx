import {
  isQuoteRequestOpen,
  useConversations,
  useMarkConversationRead,
  useMessages,
  useQuoteRequest,
  type Message,
  type QuoteRequestDetails,
  type Side,
} from '@afro/common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WenzeeLoader } from '@/components/brand/WenzeeLoader';
import { QueryState } from '@/components/QueryState';
import { Badge, EmptyState, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { shortDay } from '@/lib/dates';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import { QuoteActions } from '../bookings/QuoteActions';
import { clientName } from '../pro/clientName';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { QuoteCard } from './QuoteCard';
import { requestStatus } from './requestStatus';

type Quote = QuoteRequestDetails['quotes'][number];
type ThreadItem = { kind: 'message'; message: Message } | { kind: 'quote'; quote: Quote };

/** Les messages et les devis, dans l'ordre où ils sont arrivés (le devis s'affiche dans le fil). */
function threadItems(messages: Message[], quotes: Quote[]): ThreadItem[] {
  return [
    ...messages.map((message) => ({ kind: 'message' as const, message, at: message.createdAt })),
    ...quotes.map((quote) => ({ kind: 'quote' as const, quote, at: quote.createdAt })),
  ]
    .sort((a, b) => a.at.localeCompare(b.at))
    .map(({ at: _at, ...item }) => item);
}

/**
 * Le fil d'une conversation (C4, maquette « Conversation avec devis »), par-dessus les onglets.
 * - En haut : le prestataire, l'événement et le badge de la demande.
 * - Le fil : messages, messages automatiques et devis. Il se rafraîchit toutes les 7 s.
 * - En bas : la zone d'écriture, collée au clavier ; une demande close ferme la conversation.
 * À l'ouverture, la conversation est marquée comme lue (la pastille de l'onglet baisse).
 * Côté prestataire (S5, lot M14) : le nom du client en haut, et pas de boutons sous les devis.
 */
export function ConversationScreen({ side = 'client' }: { side?: Side }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const userId = useSessionStore((s) => s.user?.id);
  const conversations = useConversations(side);
  const summary = conversations.data?.find((c) => c.conversation.id === id);
  const messages = useMessages(id);
  const details = useQuoteRequest(summary?.conversation.quoteRequestId ?? '');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  // À l'ouverture, et dès qu'un message arrive : la conversation est lue.
  const unread = summary?.unreadCount ?? 0;
  const { mutate: markRead } = useMarkConversationRead();
  useEffect(() => {
    if (unread > 0) markRead(id);
  }, [id, unread, markRead]);

  const request = details.data?.request;
  const closed =
    request !== undefined && !isQuoteRequestOpen(request.status) && request.status !== 'accepted';
  const status = request ? requestStatus(request, side) : undefined;
  const name = !summary
    ? ''
    : side === 'client'
      ? summary.providerName
      : clientName(summary.otherParticipant);

  if (conversations.isSuccess && !summary) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState className="flex-1" title={t('messages.notFound')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          className="flex-row items-center gap-3 border-b border-border px-4 py-2"
          accessibilityLabel={name ? t('messages.conversationWith', { name }) : undefined}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('messages.back')}
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace(side === 'client' ? '/messages' : '/pro/messages')
            }
            className="min-h-touch min-w-touch items-center justify-center rounded-full border border-border bg-card"
          >
            <ChevronLeft size={22} color={colors.foreground} />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text weight="bold" numberOfLines={1} accessibilityRole="header">
              {name}
            </Text>
            {request ? (
              <Text size="xs" tone="muted" numberOfLines={1}>
                {`${t(`eventTypes.${request.eventType}`)} · ${shortDay(request.eventDate, locale)}`}
              </Text>
            ) : null}
          </View>
          {status ? <Badge variant={status.tone}>{status.label}</Badge> : null}
        </View>

        <QueryState
          isPending={messages.isPending}
          isError={messages.isError}
          onRetry={() => void messages.refetch()}
          loadingLabel={t('messages.loadingMessages')}
          placeholder={
            <View className="flex-1 items-center justify-center">
              <WenzeeLoader size={64} label={t('messages.loadingMessages')} />
            </View>
          }
        >
          <ScrollView
            ref={scroll}
            className="flex-1"
            accessibilityLabel={t('messages.thread')}
            contentContainerClassName="gap-3 px-4 py-3"
            // On descend en bas du fil à l'ouverture et quand un message arrive.
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
          >
            {threadItems(messages.data ?? [], details.data?.quotes ?? []).map((item) =>
              item.kind === 'message' ? (
                <MessageBubble
                  key={item.message.id}
                  message={item.message}
                  isMine={item.message.senderId === userId}
                />
              ) : (
                <QuoteCard key={item.quote.id} quote={item.quote}>
                  {details.data && side === 'client' ? (
                    <QuoteActions details={details.data} quote={item.quote} />
                  ) : null}
                </QuoteCard>
              ),
            )}
          </ScrollView>
        </QueryState>

        {closed ? (
          <View className="border-t border-border bg-muted px-5 py-4">
            <Text size="sm" tone="muted" className="text-center">
              {t('messages.closed')}
            </Text>
          </View>
        ) : (
          <MessageComposer conversationId={id} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
