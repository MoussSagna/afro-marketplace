import { MASKED_CONTACT_PLACEHOLDER, type Message } from '@afro/common';
import { ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { messageTime } from '@/lib/dates';
import { useThemeColors } from '@/theme/useTheme';

/**
 * Un message du fil (maquette C4) : à droite en terre si c'est le mien, à gauche sur carte sinon,
 * centré en gris si c'est un message automatique (« Devis envoyé »…).
 * Les coordonnées masquées (règle n° 7) sont remplacées par une pastille « coordonnées masquées ».
 */
export function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const time = messageTime(message.createdAt, locale);

  if (message.kind === 'system') {
    return (
      <View className="my-1 self-center rounded-full bg-muted px-3 py-1">
        <Text size="xs" tone="muted" className="text-center">
          {`${message.body} · ${time}`}
        </Text>
      </View>
    );
  }

  // Le texte, découpé autour des coordonnées masquées.
  const parts = message.body.split(MASKED_CONTACT_PLACEHOLDER);
  return (
    <View
      className={cn('max-w-[82%] gap-1', isMine ? 'items-end self-end' : 'items-start self-start')}
    >
      <View
        className={cn(
          'rounded-[18px] px-3.5 py-2.5',
          isMine ? 'rounded-br-md bg-primary' : 'rounded-bl-md border border-border bg-card',
        )}
        accessible
        accessibilityLabel={`${message.body.replaceAll(MASKED_CONTACT_PLACEHOLDER, t('messages.masked'))}, ${time}`}
      >
        <Text size="sm" tone={isMine ? 'inverse' : 'default'}>
          {parts.map((part, index) => (
            <Text key={index} size="sm" tone={isMine ? 'inverse' : 'default'}>
              {part}
              {index < parts.length - 1 ? (
                <Text
                  size="sm"
                  weight="semibold"
                  className={cn('rounded', isMine ? 'text-accent' : 'text-warning')}
                >
                  {` ${t('messages.masked')} `}
                </Text>
              ) : null}
            </Text>
          ))}
        </Text>
      </View>
      {message.hasMaskedContent ? (
        <View className="flex-row items-center gap-1">
          <ShieldCheck size={13} color={colors['muted-foreground']} />
          <Text size="caption" tone="muted">
            {t('messages.maskedHint')}
          </Text>
        </View>
      ) : null}
      <Text size="caption" tone="muted" importantForAccessibility="no">
        {time}
      </Text>
    </View>
  );
}
