import { formatPrice } from '@afro/common';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type GestureResponderEvent } from 'react-native';
import { Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';

/** Le curseur va de 0 à 5 000 €, par pas de 100 € ; tout à droite = « sans limite ». En centimes. */
export const BUDGET_LIMIT = 500_000;
export const BUDGET_STEP = 10_000;
const BARS = 20;

type BudgetSliderProps = {
  /** Le budget maximum en centimes, ou undefined = sans limite. */
  value?: number;
  onChange(value: number | undefined): void;
  /** Les prix « dès … » des prestataires (en centimes), pour dessiner l'histogramme. */
  prices: number[];
};

const clamp = (value: number) =>
  Math.min(BUDGET_LIMIT, Math.max(BUDGET_STEP, Math.round(value / BUDGET_STEP) * BUDGET_STEP));

/**
 * Le budget façon Airbnb : l'histogramme des prix, et un curseur qu'on fait glisser.
 * Les barres à gauche du curseur (les prix dans le budget) sont en terre, les autres grisées.
 * Au lecteur d'écran, c'est un réglage qu'on augmente ou diminue (gestes haut / bas).
 */
export function BudgetSlider({ value, onChange, prices }: BudgetSliderProps) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [width, setWidth] = useState(0);
  const current = value ?? BUDGET_LIMIT;
  const ratio = current / BUDGET_LIMIT;
  const label = value === undefined ? t('search.noLimit') : formatPrice(value, locale);

  // Combien de prestataires dans chaque tranche de prix (la dernière prend tout ce qui dépasse).
  const counts = Array.from({ length: BARS }, () => 0);
  for (const price of prices) {
    counts[Math.min(BARS - 1, Math.floor((price / BUDGET_LIMIT) * BARS))]! += 1;
  }
  const highest = Math.max(1, ...counts);

  const set = (next: number) => onChange(next >= BUDGET_LIMIT ? undefined : next);
  const fromTouch = (event: GestureResponderEvent) => {
    if (width > 0) set(clamp((event.nativeEvent.locationX / width) * BUDGET_LIMIT));
  };

  return (
    <View className="mt-3">
      <View
        className="h-14 flex-row items-end gap-[3px] px-2.5"
        importantForAccessibility="no-hide-descendants"
      >
        {counts.map((count, index) => (
          <View
            key={index}
            className={cn(
              'flex-1 rounded-t-sm',
              (index + 0.5) / BARS <= ratio ? 'bg-primary' : 'bg-input',
            )}
            style={{ height: count ? 6 + (50 * count) / highest : 2 }}
          />
        ))}
      </View>
      <View
        className="mx-2.5 h-10 justify-center"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={fromTouch}
        onResponderMove={fromTouch}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('search.budgetMax')}
        accessibilityValue={{ text: label }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          set(
            clamp(current + (event.nativeEvent.actionName === 'increment' ? 1 : -1) * BUDGET_STEP),
          )
        }
        testID="budget-slider"
      >
        <View className="h-1 rounded-full bg-input" pointerEvents="none">
          <View className="h-1 rounded-full bg-primary" style={{ width: `${ratio * 100}%` }} />
        </View>
        <View
          pointerEvents="none"
          className="absolute h-7 w-7 rounded-full border border-input bg-card"
          style={{
            left: Math.max(0, ratio * width - 14),
            boxShadow: '0 2px 6px rgba(43, 26, 18, 0.25)',
          }}
        />
      </View>
      <View className="mt-2 self-start rounded-xl border border-input px-3.5 py-2">
        <Text size="caption" tone="muted">
          {t('search.maximum')}
        </Text>
        <Text size="sm" weight="semibold">
          {label}
        </Text>
      </View>
    </View>
  );
}
