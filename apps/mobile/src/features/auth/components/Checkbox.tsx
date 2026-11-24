import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';

type CheckboxProps = {
  checked: boolean;
  onChange(checked: boolean): void;
  /** Ce que lit VoiceOver (le texte visible peut contenir des liens). */
  accessibilityLabel: string;
  children: ReactNode;
  error?: string;
};

/** Une case à cocher avec son texte (ex. l'acceptation des conditions). */
export function Checkbox({
  checked,
  onChange,
  accessibilityLabel,
  children,
  error,
}: CheckboxProps) {
  const colors = useThemeColors();
  return (
    <View className="gap-1">
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={accessibilityLabel}
        onPress={() => onChange(!checked)}
        className="min-h-touch flex-row items-center gap-3"
      >
        <View
          className={cn(
            'h-6 w-6 items-center justify-center rounded-md border-[1.5px]',
            checked ? 'border-primary bg-primary' : error ? 'border-destructive' : 'border-input',
          )}
        >
          {checked ? (
            <Check size={16} color={colors['primary-foreground']} strokeWidth={3} />
          ) : null}
        </View>
        <View className="flex-1">{children}</View>
      </Pressable>
      {error ? (
        <Text size="caption" weight="medium" tone="destructive" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
