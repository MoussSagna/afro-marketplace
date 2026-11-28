import type { Side } from '@afro/common';
import { useRouter } from 'expo-router';
import { BadgeCheck, ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Photo, Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn, initials } from '@/lib/cn';
import { conversationTime } from '@/lib/dates';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/useTheme';
import type { ConversationEntry } from '../conversationList';
import { conversationHref } from '../conversationHref';

/** Diamètre des avatars de la liste (tous identiques). */
export const CONVERSATION_AVATAR = 52;

/**
 * Une conversation de la liste : avatar, nom (+ badge vérifié), catégorie, dernier message,
 * date à droite, et la pastille ocre des non-lus. Toute la ligne ouvre la conversation.
 * Non lue : nom et aperçu en gras, point ocre avant le nom, fond légèrement ocre.
 */
export const ConversationItem = memo(function ConversationItem({
  entry,
  side,
}: {
  entry: ConversationEntry;
  side: Side;
}) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const router = useRouter();
  const colors = useThemeColors();
  const userId = useSessionStore((s) => s.user?.id);
  const { summary, name, subtitle, avatarUrl, verified } = entry;
  const { conversation, lastMessage, unreadCount } = summary;
  const unread = unreadCount > 0;
  const preview = !lastMessage
    ? t('messages.noMessage')
    : lastMessage.senderId === userId && lastMessage.kind !== 'system'
      ? t('messages.you', { body: lastMessage.body })
      : lastMessage.body;
  const time = conversationTime(conversation.lastMessageAt, locale, t('messages.yesterday'));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        name,
        unread ? t('messages.unread', { count: unreadCount }) : undefined,
        verified ? t('common.verified') : undefined,
        subtitle,
        preview,
        time,
      ]
        .filter(Boolean)
        .join(', ')}
      onPress={() => router.push(conversationHref(conversation.id, side))}
      className={cn(
        'flex-row items-center gap-3.5 py-3 pl-5 pr-3 active:bg-muted',
        unread && 'bg-cta/10',
      )}
    >
      <ConversationAvatar name={name} uri={avatarUrl} />

      <View className="min-w-0 flex-1 gap-px">
        <View className="flex-row items-center gap-1.5">
          {unread ? <View className="h-2.5 w-2.5 rounded-full bg-cta" /> : null}
          <Text
            size="sm"
            weight={unread ? 'bold' : 'semibold'}
            numberOfLines={1}
            className="shrink text-[16px] leading-[21px]"
          >
            {name}
          </Text>
          {verified ? (
            <BadgeCheck size={18} color={colors.background} fill={colors.cta} strokeWidth={2.2} />
          ) : null}
        </View>
        {subtitle ? (
          <Text size="sm" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <Text
          size="sm"
          numberOfLines={1}
          weight={unread ? 'bold' : 'regular'}
          className={cn(lastMessage?.kind === 'system' && 'italic')}
        >
          {preview}
        </Text>
      </View>

      <View className="items-end gap-2 self-stretch pt-0.5">
        <Text
          size="xs"
          weight={unread ? 'semibold' : 'regular'}
          tone={unread ? 'default' : 'muted'}
        >
          {time}
        </Text>
        {unread ? <UnreadIndicator count={unreadCount} /> : null}
      </View>
      <ChevronRight size={20} color={colors['muted-foreground']} />
    </Pressable>
  );
});

/** Photo ronde (expo-image, mise en cache), ou initiales sur fond sable. Décorative : le nom est lu à côté. */
function ConversationAvatar({ name, uri }: { name: string; uri?: string }) {
  const size = { width: CONVERSATION_AVATAR, height: CONVERSATION_AVATAR };
  if (uri) return <Photo uri={uri} className="rounded-full" style={size} />;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="items-center justify-center rounded-full bg-secondary"
      style={size}
    >
      <Text size="sm" weight="bold" tone="primary" className="text-[20px]">
        {initials(name)}
      </Text>
    </View>
  );
}

/** Le rond ocre avec le nombre de messages non lus (« 9+ » au-delà). */
function UnreadIndicator({ count }: { count: number }) {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="h-[22px] min-w-[22px] items-center justify-center rounded-full bg-cta px-1.5"
    >
      <Text size="caption" weight="bold" className="text-cta-foreground">
        {count > 9 ? '9+' : String(count)}
      </Text>
    </View>
  );
}
