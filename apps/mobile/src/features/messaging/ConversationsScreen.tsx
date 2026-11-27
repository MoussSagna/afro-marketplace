import { useConversations, type ConversationSummary, type Side } from '@afro/common';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import emptyImage from '../../../assets/images/aucun-resultat.webp';
import { QueryState } from '@/components/QueryState';
import { Avatar, Button, EmptyState, Heading, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { messageTime } from '@/lib/dates';
import { useSessionStore } from '@/stores/session';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import { clientName } from '../pro/clientName';
import { conversationHref } from './conversationHref';

/**
 * L'onglet Messages (C4, maquette « Messages ») : une conversation par demande de devis,
 * la plus récente en haut. Pastille soleil = messages non lus. Rafraîchi toutes les 7 s.
 * Côté prestataire (S5, lot M14), la même liste, au nom des clients.
 */
export function ConversationsScreen({ side = 'client' }: { side?: Side }) {
  const { t } = useTranslation();
  const router = useRouter();
  const conversations = useConversations(side);
  const onScroll = useCollapseOnScroll();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 pb-1.5 pt-2">
        <Heading>{t('messages.title')}</Heading>
      </View>
      <QueryState
        isPending={conversations.isPending}
        isError={conversations.isError}
        onRetry={() => void conversations.refetch()}
        loadingLabel={t('messages.loading')}
      >
        <FlatList
          data={conversations.data ?? []}
          keyExtractor={(item) => item.conversation.id}
          accessibilityLabel={t('messages.list')}
          renderItem={({ item }) => <ConversationRow summary={item} side={side} />}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={conversations.isRefetching}
              onRefresh={() => void conversations.refetch()}
            />
          }
          ListEmptyComponent={
            <EmptyState
              className="flex-1"
              image={emptyImage}
              title={t('messages.emptyTitle')}
              description={t(side === 'client' ? 'messages.emptyHint' : 'messages.emptyHintPro')}
              action={
                side === 'client' ? (
                  <Button size="md" onPress={() => router.navigate('/')}>
                    {t('messages.findProvider')}
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

function ConversationRow({ summary, side }: { summary: ConversationSummary; side: Side }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const router = useRouter();
  const userId = useSessionStore((s) => s.user?.id);
  const { conversation, providerName, otherParticipant, lastMessage, unreadCount } = summary;
  const name = side === 'client' ? providerName : clientName(otherParticipant);
  const unread = unreadCount > 0;
  const preview = !lastMessage
    ? t('messages.noMessage')
    : lastMessage.senderId === userId && lastMessage.kind !== 'system'
      ? t('messages.you', { body: lastMessage.body })
      : lastMessage.body;
  const time = messageTime(conversation.lastMessageAt, locale);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        name,
        unread ? t('messages.unread', { count: unreadCount }) : undefined,
        preview,
        time,
      ]
        .filter(Boolean)
        .join(', ')}
      onPress={() => router.push(conversationHref(conversation.id, side))}
      className="flex-row items-center gap-3 border-b border-border px-5 py-3.5 active:bg-muted"
    >
      <Avatar name={name} uri={otherParticipant.avatarUrl} />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text size="sm" weight="bold" numberOfLines={1} className="shrink">
            {name}
          </Text>
          <Text size="xs" tone="muted">
            {time}
          </Text>
        </View>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text
            size="xs"
            numberOfLines={1}
            weight={unread ? 'semibold' : 'regular'}
            tone={unread ? 'default' : 'muted'}
            className={cn('flex-1', lastMessage?.kind === 'system' && 'italic')}
          >
            {preview}
          </Text>
          {unread ? (
            <View className="h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5">
              <Text size="caption" weight="bold" className="text-accent-foreground">
                {String(unreadCount)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
