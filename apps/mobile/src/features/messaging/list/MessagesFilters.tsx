import { FileText, Inbox } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';
import { CONVERSATION_FILTERS, type ConversationFilter } from '../conversationList';

const LABELS = {
  all: 'messages.filterAll',
  unread: 'messages.filterUnread',
  quotes: 'messages.filterQuotes',
} as const;

/**
 * Les pastilles « Tous », « Non lus (n) », « Devis » sous le titre.
 * La pastille choisie a un fond ocre clair ; le compteur des non-lus suit les données.
 */
export function MessagesFilters({
  value,
  onChange,
  counts,
}: {
  value: ConversationFilter;
  onChange(filter: ConversationFilter): void;
  counts: Record<ConversationFilter, number>;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const icons: Record<ConversationFilter, ReactNode> = {
    all: <Inbox size={18} color={value === 'all' ? colors.primary : colors.foreground} />,
    unread: <View className="h-2.5 w-2.5 rounded-full bg-primary" />,
    quotes: <FileText size={18} color={value === 'quotes' ? colors.primary : colors.foreground} />,
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      accessibilityLabel={t('messages.filters')}
      // Une ScrollView prend toute la hauteur libre par défaut : la rangée garde la sienne.
      className="grow-0"
      contentContainerClassName="gap-2.5 px-5 pb-2 pt-3"
      keyboardShouldPersistTaps="handled"
    >
      {CONVERSATION_FILTERS.map((filter) => {
        const selected = value === filter;
        const name = t(LABELS[filter]);
        // Seul « Non lus » affiche son nombre (comme la maquette), et seulement s'il y en a.
        const label =
          filter === 'unread' && counts.unread > 0
            ? t('messages.filterCount', { name, count: counts.unread })
            : name;
        return (
          <Pressable
            key={filter}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={() => onChange(filter)}
            className={cn(
              'h-10 flex-row items-center gap-2 rounded-full px-4 active:opacity-80',
              selected ? 'bg-cta/25' : 'bg-muted',
            )}
          >
            {icons[filter]}
            <Text size="sm" weight={selected ? 'bold' : 'semibold'}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
