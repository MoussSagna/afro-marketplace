import {
  CheckCheck,
  CloudOff,
  FileText,
  MessageCircle,
  SearchX,
  Sparkles,
} from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button, Heading, Text } from '@/components/ui';
import { useThemeColors } from '@/theme/useTheme';

const ICONS = {
  empty: MessageCircle,
  search: SearchX,
  unread: CheckCheck,
  quotes: FileText,
  error: CloudOff,
} as const;

export type MessagesEmptyKind = keyof typeof ICONS;

/**
 * Les écrans « rien à afficher » de l'onglet Messages, tous sur le même modèle
 * (comme l'état vide des Favoris) : une icône sur un rond sable, un titre, une phrase, un bouton.
 * - empty : aucune conversation ; search : recherche sans résultat ; unread / quotes : pastille vide ;
 *   error : chargement impossible (avec « Réessayer »).
 * Le grand rond (avec l'étincelle) est réservé à « aucune conversation » ; les autres restent discrets.
 */
export function MessagesEmptyState({
  kind,
  title,
  description,
  actionLabel,
  onAction,
}: {
  kind: MessagesEmptyKind;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?(): void;
}) {
  const colors = useThemeColors();
  const Icon = ICONS[kind];
  const large = kind === 'empty';

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      // Les petits états restent en haut : visibles au-dessus du clavier pendant une recherche.
      className={
        large
          ? 'flex-1 items-center justify-center gap-3 px-8 py-12'
          : 'items-center gap-3 px-8 pb-8 pt-10'
      }
    >
      <View
        className={
          large
            ? 'mb-3 h-40 w-40 items-center justify-center rounded-full bg-secondary'
            : 'mb-1 h-20 w-20 items-center justify-center rounded-full bg-secondary'
        }
      >
        <Icon
          size={large ? 72 : 36}
          color={kind === 'error' ? colors['muted-foreground'] : colors['title-accent']}
          strokeWidth={large ? 1.3 : 1.6}
        />
        {large ? (
          <View className="absolute right-3 top-4">
            <Sparkles size={24} color={colors.ochre} strokeWidth={1.6} />
          </View>
        ) : null}
      </View>
      <Heading level={large ? 2 : 3} className="text-center">
        {title}
      </Heading>
      {description ? (
        <Text size="sm" tone="muted" className="text-center">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          variant={large ? 'cta' : 'outline'}
          size="md"
          className="mt-2 self-center"
          onPress={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </Animated.View>
  );
}
