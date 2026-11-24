import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useErrorText } from '@/i18n/useErrorText';

const LENGTH = 6;

type CodeInputProps = {
  value: string;
  onChange(value: string): void;
  error?: string;
  editable?: boolean;
};

/**
 * Le code à 6 chiffres en 6 cases (maquette « Vérifie ton email »).
 * Astuce : il n'y a qu'un seul vrai champ, invisible, posé sur les cases. Il reçoit le clavier
 * numérique et le code proposé par iOS ou Android (« Depuis Messages : 123456 ») ;
 * les cases ne font qu'afficher ses chiffres.
 */
export function CodeInput({ value, onChange, error, editable = true }: CodeInputProps) {
  const { t } = useTranslation();
  const { fieldError } = useErrorText();
  const shownError = fieldError(error);
  const [focused, setFocused] = useState(true);
  return (
    <View className="gap-2">
      <View>
        <View
          className="flex-row justify-between gap-2"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length: LENGTH }, (_, index) => {
            const digit = value[index];
            const current = focused && index === Math.min(value.length, LENGTH - 1);
            return (
              <View
                key={index}
                className={cn(
                  'h-14 flex-1 items-center justify-center rounded-md border bg-card',
                  error
                    ? 'border-[1.5px] border-destructive'
                    : current
                      ? 'border-[1.5px] border-primary'
                      : 'border-input',
                )}
              >
                <Text weight="bold" className="text-h3">
                  {digit ?? ''}
                </Text>
              </View>
            );
          })}
        </View>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, LENGTH))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          autoFocus
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={LENGTH}
          caretHidden
          accessibilityLabel={t('auth.codeLabel')}
          accessibilityHint={shownError}
          style={styles.hidden}
          importantForAccessibility="yes"
        />
      </View>
      {error ? (
        <Text size="caption" weight="medium" tone="destructive" accessibilityLiveRegion="polite">
          {shownError}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Invisible mais touchable : il couvre les 6 cases.
  hidden: { ...StyleSheet.absoluteFill, opacity: 0.02, color: 'transparent' },
});
