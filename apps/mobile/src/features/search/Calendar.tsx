import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';
import { isoDay, longDay, monthGrid, monthTitle, todayIso, weekdayInitials } from './searchDates';

type CalendarProps = {
  /** Le jour choisi (« 2026-12-14 »), s'il y en a un. */
  value?: string;
  onChange(isoDate: string): void;
};

/**
 * Un calendrier d'un mois (étape « Quand ? ») : on change de mois avec les flèches,
 * les jours passés sont barrés et ne se touchent pas, le jour choisi est en terre.
 */
export function Calendar({ value, onChange }: CalendarProps) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const today = todayIso();
  const start = value ?? today;
  const [month, setMonth] = useState({
    year: Number(start.slice(0, 4)),
    month: Number(start.slice(5, 7)) - 1,
  });
  const isCurrentMonth = isoDay(month.year, month.month, 1) <= today;
  const move = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const next = new Date(Date.UTC(year, m + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });

  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text weight="bold">{monthTitle(month.year, month.month, locale)}</Text>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('search.previousMonth')}
            accessibilityState={{ disabled: isCurrentMonth }}
            disabled={isCurrentMonth}
            onPress={() => move(-1)}
            className={cn(
              'h-9 w-9 items-center justify-center rounded-full border border-border',
              isCurrentMonth && 'opacity-40',
            )}
          >
            <ChevronLeft size={18} color={colors.foreground} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('search.nextMonth')}
            onPress={() => move(1)}
            className="h-9 w-9 items-center justify-center rounded-full border border-border"
          >
            <ChevronRight size={18} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
      <View className="mt-3 flex-row" importantForAccessibility="no-hide-descendants">
        {weekdayInitials(locale).map((initial, index) => (
          <Text
            key={index}
            size="caption"
            weight="semibold"
            tone="muted"
            className="flex-1 text-center"
          >
            {initial}
          </Text>
        ))}
      </View>
      <View className="mt-1 flex-row flex-wrap">
        {monthGrid(month.year, month.month).map((day, index) => {
          if (day === null) return <View key={`blank-${index}`} className="h-10 w-[14.28%]" />;
          const iso = isoDay(month.year, month.month, day);
          const past = iso < today;
          const selected = iso === value;
          return (
            <View key={iso} className="h-10 w-[14.28%] items-center justify-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={longDay(iso, locale)}
                accessibilityState={{ selected, disabled: past }}
                disabled={past}
                onPress={() => onChange(iso)}
                className={cn(
                  'h-10 w-10 items-center justify-center rounded-full',
                  selected && 'bg-primary',
                )}
              >
                <Text
                  size="sm"
                  weight={selected ? 'bold' : 'medium'}
                  tone={selected ? 'inverse' : past ? 'muted' : 'default'}
                  className={past ? 'line-through opacity-60' : undefined}
                >
                  {String(day)}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
