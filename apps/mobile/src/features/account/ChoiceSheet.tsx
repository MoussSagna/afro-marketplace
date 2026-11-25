import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';

type ChoiceSheetProps<T extends string> = {
  visible: boolean;
  onClose(): void;
  title: string;
  closeLabel: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  /** Appelé avec le choix ; le panneau se ferme ensuite. */
  onChange(value: T): void;
};

/** Un panneau du bas avec une liste de choix (Apparence, Langue) : un seul possible. */
export function ChoiceSheet<T extends string>({
  visible,
  onClose,
  title,
  closeLabel,
  options,
  value,
  onChange,
}: ChoiceSheetProps<T>) {
  const colors = useThemeColors();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} closeLabel={closeLabel}>
      <View accessibilityRole="radiogroup" accessibilityLabel={title} className="gap-2">
        {options.map((option) => {
          const on = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => {
                onChange(option.value);
                onClose();
              }}
              className={cn(
                'flex-row items-center justify-between rounded-2xl border px-4 py-3.5',
                on ? 'border-primary bg-secondary' : 'border-border bg-card',
              )}
            >
              <Text size="sm" weight={on ? 'bold' : 'medium'}>
                {option.label}
              </Text>
              {on ? <Check size={18} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
