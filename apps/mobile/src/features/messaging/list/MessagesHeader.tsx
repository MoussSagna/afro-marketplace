import { useRouter } from 'expo-router';
import { Search, SquarePen, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Heading } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';

type MessagesHeaderProps = {
  /** Le champ de recherche est ouvert. */
  searching: boolean;
  onToggleSearch(): void;
  query: string;
  onChangeQuery(query: string): void;
  /** « Nouvelle conversation » : côté client seulement (un prestataire ne démarre pas d'échange). */
  canCompose: boolean;
  placeholder: string;
};

/**
 * Le haut de l'onglet Messages : le titre, la loupe et « Nouvelle conversation ».
 * La loupe ouvre un champ sous le titre ; la liste se filtre à chaque lettre.
 * « Nouvelle conversation » reprend le parcours existant : on contacte un prestataire
 * depuis la Recherche (fiche → demande de devis), ce qui ouvre la conversation.
 */
export function MessagesHeader({
  searching,
  onToggleSearch,
  query,
  onChangeQuery,
  canCompose,
  placeholder,
}: MessagesHeaderProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View className="px-5 pt-2">
      <View className="flex-row items-center justify-between">
        <Heading>{t('messages.title')}</Heading>
        <View className="-mr-2 flex-row items-center gap-1">
          <IconButton
            label={t(searching ? 'messages.closeSearch' : 'messages.search')}
            active={searching}
            onPress={onToggleSearch}
          >
            <Search size={24} color={colors.foreground} strokeWidth={2} />
          </IconButton>
          {canCompose ? (
            <IconButton
              label={t('messages.newConversation')}
              hint={t('messages.newConversationHint')}
              onPress={() => router.navigate('/')}
            >
              <SquarePen size={24} color={colors.foreground} strokeWidth={2} />
            </IconButton>
          ) : null}
        </View>
      </View>

      {searching ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          className="mt-2 h-11 flex-row items-center gap-2 rounded-full bg-muted px-4"
        >
          <Search size={18} color={colors['muted-foreground']} />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder={placeholder}
            placeholderTextColor={colors['muted-foreground']}
            accessibilityLabel={placeholder}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="never"
            className="flex-1 font-sans text-body text-foreground"
            style={{ paddingVertical: 0 }}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('messages.clearSearch')}
              onPress={() => onChangeQuery('')}
              hitSlop={10}
              className="h-6 w-6 items-center justify-center rounded-full bg-clay/40 active:opacity-70"
            >
              <X size={14} color={colors.foreground} strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

function IconButton({
  label,
  hint,
  active = false,
  onPress,
  children,
}: {
  label: string;
  hint?: string;
  active?: boolean;
  onPress(): void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ expanded: active }}
      onPress={onPress}
      className={cn(
        'h-11 w-11 items-center justify-center rounded-full active:bg-muted',
        active && 'bg-muted',
      )}
    >
      {children}
    </Pressable>
  );
}
