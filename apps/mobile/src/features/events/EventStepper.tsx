import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';

const LABELS = ['events.form.stepType', 'events.form.stepInfo', 'events.form.stepDetails'] as const;

/** La progression du formulaire (maquette) : 3 ronds reliés ; les étapes faites sont cochées en vert. */
export function EventStepper({ step }: { step: number }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('events.form.progress', { step, label: t(LABELS[step - 1]!) })}
      accessibilityValue={{ min: 1, max: 3, now: step }}
      className="flex-row items-start px-5 py-3"
    >
      {LABELS.map((key, index) => {
        const n = index + 1;
        const done = n < step;
        const current = n === step;
        return (
          <View key={key} className="flex-1 items-center gap-1.5">
            {index > 0 ? (
              <View
                className={cn('absolute top-[13px] h-0.5', n <= step ? 'bg-success' : 'bg-border')}
                style={{ left: '-50%', right: '50%' }}
              />
            ) : null}
            <View
              className={cn(
                'h-7 w-7 items-center justify-center rounded-full',
                done ? 'bg-success' : current ? 'bg-cta' : 'border border-border bg-card',
              )}
            >
              {done ? (
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Text
                  size="xs"
                  weight="bold"
                  style={{ color: current ? colors['cta-foreground'] : colors['muted-foreground'] }}
                >
                  {String(n)}
                </Text>
              )}
            </View>
            <Text
              size="xs"
              weight={current ? 'bold' : 'medium'}
              tone={current ? 'default' : 'muted'}
            >
              {t(key)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
