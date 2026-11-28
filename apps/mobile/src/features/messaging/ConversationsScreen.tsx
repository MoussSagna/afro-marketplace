import type { Side } from '@afro/common';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/theme/useTheme';
import { TAB_BAR_SPACE } from '../navigation/GlassTabBar';
import { useCollapseOnScroll } from '../navigation/useCollapseOnScroll';
import {
  conversationCounts,
  visibleConversations,
  type ConversationEntry,
  type ConversationFilter,
} from './conversationList';
import { ConversationItem } from './list/ConversationItem';
import { ConversationSkeleton } from './list/ConversationSkeleton';
import { MessagesEmptyState } from './list/MessagesEmptyState';
import { MessagesFilters } from './list/MessagesFilters';
import { MessagesHeader } from './list/MessagesHeader';
import { useConversationList } from './useConversationList';

/**
 * L'onglet Messages (C4, refonte du 28/11/2026) : une conversation par demande de devis,
 * la plus récente en haut, rafraîchie toutes les 7 s.
 * - En-tête : titre, loupe (recherche instantanée par nom ou catégorie), « Nouvelle conversation ».
 * - Pastilles : Tous, Non lus (n), Devis.
 * - Lignes : avatar, nom (+ badge vérifié), catégorie, dernier message, date, non-lus.
 * Côté prestataire (S5), la même liste au nom des clients, sans « Nouvelle conversation ».
 */
export function ConversationsScreen({ side = 'client' }: { side?: Side }) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const list = useConversationList(side);
  const onScroll = useCollapseOnScroll();
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const counts = useMemo(() => conversationCounts(list.entries), [list.entries]);
  const shown = useMemo(
    () => visibleConversations(list.entries, filter, query),
    [list.entries, filter, query],
  );

  const toggleSearch = () => {
    setSearching((open) => !open);
    setQuery('');
  };

  const empty = () => {
    if (list.entries.length === 0) {
      return (
        <MessagesEmptyState
          kind="empty"
          title={t('messages.emptyTitle')}
          description={t(side === 'client' ? 'messages.emptyHint' : 'messages.emptyHintPro')}
          actionLabel={side === 'client' ? t('messages.findProvider') : undefined}
          onAction={() => router.navigate('/')}
        />
      );
    }
    if (query.trim()) {
      return (
        <MessagesEmptyState
          kind="search"
          title={t('messages.noResultTitle')}
          description={t('messages.noResultHint')}
          actionLabel={t('messages.clearSearch')}
          onAction={() => setQuery('')}
        />
      );
    }
    const kind = filter === 'unread' ? 'unread' : 'quotes';
    return (
      <MessagesEmptyState
        kind={kind}
        title={t(kind === 'unread' ? 'messages.noUnreadTitle' : 'messages.noQuotesTitle')}
        description={t(kind === 'unread' ? 'messages.noUnreadHint' : 'messages.noQuotesHint')}
        actionLabel={t('messages.showAll')}
        onAction={() => setFilter('all')}
      />
    );
  };

  const body = () => {
    if (list.isPending) return <ConversationSkeleton />;
    if (list.isError) {
      return (
        <MessagesEmptyState
          kind="error"
          title={t('messages.loadErrorTitle')}
          description={t('messages.loadErrorHint')}
          actionLabel={t('common.retry')}
          onAction={() => void list.refetch()}
        />
      );
    }
    return (
      <FlatList
        data={shown}
        keyExtractor={(entry) => entry.summary.conversation.id}
        accessibilityLabel={t('messages.list')}
        renderItem={({ item }: { item: ConversationEntry }) => (
          <ConversationItem entry={item} side={side} />
        )}
        ItemSeparatorComponent={Separator}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching}
            onRefresh={() => void list.refetch()}
            tintColor={colors.ochre}
          />
        }
        ListEmptyComponent={empty()}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <MessagesHeader
        searching={searching}
        onToggleSearch={toggleSearch}
        query={query}
        onChangeQuery={setQuery}
        canCompose={side === 'client'}
        placeholder={t(
          side === 'client' ? 'messages.searchPlaceholder' : 'messages.searchPlaceholderPro',
        )}
      />
      {list.entries.length > 0 ? (
        <MessagesFilters value={filter} onChange={setFilter} counts={counts} />
      ) : null}
      <View className="flex-1 pt-1">{body()}</View>
    </SafeAreaView>
  );
}

/** Le trait fin entre deux conversations, aligné sur le bord gauche de la liste. */
function Separator() {
  return <View className="ml-5 bg-border" style={{ height: StyleSheet.hairlineWidth * 2 }} />;
}
