import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/theme/useTheme';

type StarRatingInputProps = {
  /** Le nom du groupe, lu par VoiceOver (« Ta note générale »). */
  label: string;
  /** 0 = pas encore choisi, sinon de 1 à 5. */
  value: number;
  onChange(value: number): void;
  /** lg : les grandes étoiles de la note générale ; sm : les sous-notes. */
  size?: 'lg' | 'sm';
  invalid?: boolean;
};

/**
 * Choisir une note de 1 à 5 étoiles (maquette C6 : grandes étoiles faciles à toucher).
 * Pour VoiceOver, c'est un groupe de 5 boutons radio : « 4 étoiles, sélectionné ».
 */
export function StarRatingInput({
  label,
  value,
  onChange,
  size = 'lg',
  invalid,
}: StarRatingInputProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const iconSize = size === 'lg' ? 40 : 24;
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className={cn('flex-row', size === 'lg' ? 'gap-2' : 'gap-0.5')}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <Pressable
            key={star}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === star }}
            accessibilityLabel={`${label}, ${t('review.star', { count: star })}`}
            onPress={() => onChange(star)}
            hitSlop={size === 'sm' ? 6 : 2}
            className="items-center justify-center"
          >
            <Star
              size={iconSize}
              color={filled ? colors.ochre : invalid ? colors.destructive : colors.input}
              fill={filled ? colors.ochre : 'transparent'}
              strokeWidth={1.75}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
