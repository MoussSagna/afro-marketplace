import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';
import { isoDay, longDay, monthGrid, monthTitle, todayIso, weekdayInitials } from '@/lib/dates';

type CalendarProps = {
  /** Le jour choisi (« 2026-12-14 »), s'il y en a un. */
  value?: string;
  /** Sans `onChange`, le calendrier se lit seulement (onglet Dispos d'un profil). */
  onChange?(isoDate: string): void;
  /** Les jours où le prestataire n'est pas libre : barrés, en rouge pâle. */
  unavailable?: ReadonlySet<string>;
  /** Prévient quand on change de mois (pour charger ses dispos). */
  onMonthChange?(year: number, month: number): void;
  /** Le premier jour qu'on peut choisir (aujourd'hui par défaut ; demain pour un devis). */
  firstDay?: string;
};

/**
 * Un calendrier d'un mois : on change de mois avec les flèches, les jours passés sont barrés.
 * - Pour choisir un jour (étape « Quand ? » de la recherche) : le jour choisi est en terre.
 * - Pour lire des disponibilités (profil) : les jours indisponibles sont barrés sur fond rouge pâle,
 *   et VoiceOver lit « …, disponible » ou « …, indisponible ».
 * - Les deux à la fois (date d'une demande de devis) : on choisit un jour, les jours pris sont barrés
 *   en rouge, mais restent touchables pour que le formulaire explique pourquoi ils sont refusés.
 */
export function Calendar({ value, onChange, unavailable, onMonthChange, firstDay }: CalendarProps) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const today = firstDay ?? todayIso();
  const start = value ?? today;
  const [month, setMonth] = useState({
    year: Number(start.slice(0, 4)),
    month: Number(start.slice(5, 7)) - 1,
  });
  const isCurrentMonth = isoDay(month.year, month.month, 1) <= today;
  const move = (delta: number) => {
    const next = new Date(Date.UTC(month.year, month.month + delta, 1));
    setMonth({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
    onMonthChange?.(next.getUTCFullYear(), next.getUTCMonth());
  };

  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text weight="bold">{monthTitle(month.year, month.month, locale)}</Text>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('calendar.previousMonth')}
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
            accessibilityLabel={t('calendar.nextMonth')}
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
          const busy = !past && (unavailable?.has(iso) ?? false);
          const label = longDay(iso, locale);
          const dayText = (
            <Text
              size="sm"
              weight={selected ? 'bold' : 'medium'}
              tone={selected ? 'inverse' : past ? 'muted' : busy ? 'destructive' : 'default'}
              className={past || (busy && !selected) ? 'line-through opacity-60' : undefined}
            >
              {String(day)}
            </Text>
          );
          if (!onChange) {
            return (
              <View
                key={iso}
                className="h-10 w-[14.28%] items-center justify-center"
                accessible
                accessibilityLabel={
                  past
                    ? label
                    : `${label}, ${busy ? t('calendar.unavailable') : t('calendar.available')}`
                }
              >
                <View
                  className={cn(
                    'h-10 w-10 items-center justify-center rounded-full',
                    busy && 'bg-destructive/15',
                  )}
                >
                  <Text
                    size="sm"
                    weight="medium"
                    tone={past ? 'muted' : busy ? 'destructive' : 'default'}
                    className={past || busy ? 'line-through opacity-60' : undefined}
                  >
                    {String(day)}
                  </Text>
                </View>
              </View>
            );
          }
          return (
            <View key={iso} className="h-10 w-[14.28%] items-center justify-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={busy ? `${label}, ${t('calendar.unavailable')}` : label}
                accessibilityState={{ selected, disabled: past }}
                disabled={past}
                onPress={() => onChange(iso)}
                className={cn(
                  'h-10 w-10 items-center justify-center rounded-full',
                  selected && 'bg-primary',
                )}
              >
                {dayText}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
