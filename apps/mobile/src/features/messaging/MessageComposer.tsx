import { useSendMessage } from '@afro/common';
import { SendHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui';
import { useErrorText } from '@/i18n/useErrorText';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';

/**
 * La zone d'écriture en bas du fil (maquette C4), collée au clavier par l'écran parent.
 * Le serveur masque les téléphones et emails (règle n° 7) : le message revient déjà masqué.
 */
export function MessageComposer({ conversationId }: { conversationId: string }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { apiError } = useErrorText();
  const send = useSendMessage(conversationId);
  const [body, setBody] = useState('');
  const empty = body.trim() === '';

  const submit = () => {
    if (empty || send.isPending) return;
    send.mutate({ body: body.trim() }, { onSuccess: () => setBody('') });
  };

  return (
    <View className="border-t border-border bg-card px-3 pb-2 pt-2.5">
      {send.isError ? (
        <Text size="xs" tone="destructive" className="mb-1.5 px-1" accessibilityRole="alert">
          {apiError(send.error)}
        </Text>
      ) : null}
      <View className="flex-row items-end gap-2">
        <TextInput
          accessibilityLabel={t('messages.inputLabel')}
          placeholder={t('messages.placeholder')}
          placeholderTextColor={colors['muted-foreground']}
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={2000}
          className="max-h-32 min-h-[44px] flex-1 rounded-[22px] bg-muted px-4 py-2.5 font-sans text-body text-foreground"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('messages.send')}
          accessibilityState={{ disabled: empty || send.isPending }}
          disabled={empty || send.isPending}
          onPress={submit}
          className={cn(
            'h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80',
            empty && 'opacity-40',
          )}
        >
          {send.isPending ? (
            <ActivityIndicator color={colors['primary-foreground']} />
          ) : (
            <SendHorizontal size={20} color={colors['primary-foreground']} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
